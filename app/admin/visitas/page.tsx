import Link from "next/link";
import { CalendarClock, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { assignVisitAction, updateVisitStatusAction } from "@/lib/visit-actions";
import { requireCurrentUser } from "@/lib/auth";
import { whatsappLink } from "@/lib/leads";
import { requireModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { isVisitStatus, visitScope, visitStatuses, visitStatusLabels } from "@/lib/visits";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ status?: string }> };

const statusColors = {
  PENDING: "bg-primary text-primary-foreground",
  CONFIRMED: "bg-emerald-600 text-white",
  CANCELED: "bg-secondary text-muted-foreground",
  DONE: "bg-emerald-800 text-white",
  NO_SHOW: "bg-red-600 text-white"
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminVisitasPage({ searchParams }: PageProps) {
  const user = await requireCurrentUser("/admin/visitas");
  await requireModule("visitas");
  const isAdmin = user.role === "ADMIN";
  const { status } = await searchParams;
  const activeStatus = isVisitStatus(status) ? status : undefined;
  const scope = visitScope(user);

  const [visits, counts, assignees] = await Promise.all([
    prisma.visit.findMany({
      where: { ...scope, ...(activeStatus ? { status: activeStatus } : {}) },
      include: {
        property: { select: { code: true, title: true } },
        assignedTo: { select: { id: true, name: true, email: true, active: true } }
      },
      orderBy: { scheduledFor: "asc" }
    }),
    prisma.visit.groupBy({ by: ["status"], where: scope, _count: true }),
    isAdmin
      ? prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } })
      : Promise.resolve([])
  ]);

  const countByStatus = Object.fromEntries(counts.map((item) => [item.status, item._count]));
  const total = counts.reduce((sum, item) => sum + item._count, 0);

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
          <h1 className="text-3xl font-bold text-foreground">Visitas</h1>
          <p className="mt-2 text-muted-foreground">
            {isAdmin ? "Visitas agendadas pelos clientes direto no site." : "Visitas atribuídas a você e visitas ainda sem responsável."}
          </p>
        </div>
        {isAdmin && (
          <LinkButton href="/admin/visitas/disponibilidade" variant="outline" className="gap-2">
            <CalendarClock className="h-4 w-4" /> Horários disponíveis
          </LinkButton>
        )}
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/admin/visitas" active={!activeStatus} label="Todas" count={total} />
        {visitStatuses.map((item) => (
          <FilterLink
            key={item}
            href={`/admin/visitas?status=${item}`}
            active={activeStatus === item}
            label={visitStatusLabels[item]}
            count={countByStatus[item] ?? 0}
          />
        ))}
      </nav>

      <div className="space-y-4">
        {visits.map((visit) => (
          <article key={visit.id} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{visit.visitorName}</h2>
                  <Badge className={statusColors[visit.status]}>{visitStatusLabels[visit.status]}</Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="h-3.5 w-3.5" /> {dateFormatter.format(visit.scheduledFor)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {visit.visitorEmail} · {visit.visitorPhone}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Imóvel:{" "}
                  {visit.property ? (
                    <Link className="font-medium text-foreground hover:text-primary" href={`/imoveis/${visit.property.code}`}>
                      {visit.property.code} · {visit.property.title}
                    </Link>
                  ) : (
                    <span className="italic">imóvel excluído</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Responsável:{" "}
                  <span className="font-medium text-foreground">
                    {visit.assignedTo ? visit.assignedTo.name ?? visit.assignedTo.email : "sem responsável"}
                    {visit.assignedTo && !visit.assignedTo.active && " (desativado — reatribua esta visita)"}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
                <a
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  href={whatsappLink(
                    visit.visitorPhone,
                    `Olá, ${visit.visitorName}! Aqui é da Prime Lar Imobiliária, sobre sua visita agendada para ${dateFormatter.format(visit.scheduledFor)}${visit.property ? ` (imóvel ${visit.property.code})` : ""}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <form action={updateVisitStatusAction.bind(null, visit.id)} className="flex gap-2">
                  <Select key={visit.status} name="status" defaultValue={visit.status} aria-label="Status da visita" className="w-44">
                    {visitStatuses.map((item) => (
                      <option key={item} value={item}>
                        {visitStatusLabels[item]}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline">
                    Salvar
                  </Button>
                </form>
                {isAdmin ? (
                  <form action={assignVisitAction.bind(null, visit.id)} className="flex gap-2">
                    <Select key={visit.assignedToId ?? "none"} name="assignedToId" defaultValue={visit.assignedToId ?? ""} aria-label="Responsável" className="w-44">
                      <option value="">Sem responsável</option>
                      {visit.assignedTo && !assignees.some((assignee) => assignee.id === visit.assignedToId) && (
                        <option value={visit.assignedTo.id}>
                          {visit.assignedTo.name ?? visit.assignedTo.email} (desativado)
                        </option>
                      )}
                      {assignees.map((assignee) => (
                        <option key={assignee.id} value={assignee.id}>
                          {assignee.name ?? assignee.email}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="outline">
                      Atribuir
                    </Button>
                  </form>
                ) : (
                  !visit.assignedToId && (
                    <form action={assignVisitAction.bind(null, visit.id)}>
                      <input type="hidden" name="assignedToId" value={user.id} />
                      <Button type="submit" variant="outline" className="w-full">
                        Assumir visita
                      </Button>
                    </form>
                  )
                )}
              </div>
            </div>
          </article>
        ))}

        {visits.length === 0 && (
          <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">Nenhuma visita encontrada.</div>
        )}
      </div>
    </main>
  );
}

function FilterLink({ href, active, label, count }: { href: string; active: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
      )}
    >
      {label} <span className="text-xs opacity-80">{count}</span>
    </Link>
  );
}
