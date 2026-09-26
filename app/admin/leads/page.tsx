import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { updateLeadStatusAction } from "@/lib/actions";
import { isLeadStatus, leadStatuses, leadStatusLabels, whatsappLink } from "@/lib/leads";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ status?: string }> };

const statusColors = {
  NEW: "bg-primary text-primary-foreground",
  IN_PROGRESS: "bg-amber-500 text-black",
  CONVERTED: "bg-emerald-600 text-white",
  LOST: "bg-secondary text-muted-foreground"
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const { status } = await searchParams;
  const activeStatus = isLeadStatus(status) ? status : undefined;

  const [leads, counts] = await Promise.all([
    prisma.lead.findMany({
      where: activeStatus ? { status: activeStatus } : {},
      include: { property: { select: { code: true, title: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.lead.groupBy({ by: ["status"], _count: true })
  ]);

  const countByStatus = Object.fromEntries(counts.map((item) => [item.status, item._count]));
  const total = counts.reduce((sum, item) => sum + item._count, 0);

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Leads</h1>
        <p className="mt-2 text-muted-foreground">Clientes que demonstraram interesse em um imóvel.</p>
      </div>

      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        <FilterLink href="/admin/leads" active={!activeStatus} label="Todos" count={total} />
        {leadStatuses.map((item) => (
          <FilterLink
            key={item}
            href={`/admin/leads?status=${item}`}
            active={activeStatus === item}
            label={leadStatusLabels[item]}
            count={countByStatus[item] ?? 0}
          />
        ))}
      </nav>

      <div className="space-y-4">
        {leads.map((lead) => (
          <article key={lead.id} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{lead.name}</h2>
                  <Badge className={statusColors[lead.status]}>{leadStatusLabels[lead.status]}</Badge>
                  <span className="text-xs text-muted-foreground">{dateFormatter.format(lead.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lead.email} · {lead.phone}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Imóvel:{" "}
                  {lead.property ? (
                    <Link className="font-medium text-foreground hover:text-primary" href={`/imoveis/${lead.property.code}`}>
                      {lead.property.code} · {lead.property.title}
                    </Link>
                  ) : (
                    <span className="italic">imóvel excluído</span>
                  )}
                </p>
                {lead.message && <p className="mt-3 whitespace-pre-line text-sm text-foreground">{lead.message}</p>}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch">
                <a
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  href={whatsappLink(
                    lead.phone,
                    `Olá, ${lead.name}! Aqui é da Prime Lar Imobiliária${lead.property ? `, sobre o imóvel ${lead.property.code}` : ""}.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <form action={updateLeadStatusAction.bind(null, lead.id)} className="flex gap-2">
                  <Select name="status" defaultValue={lead.status} aria-label="Status do lead" className="w-44">
                    {leadStatuses.map((item) => (
                      <option key={item} value={item}>
                        {leadStatusLabels[item]}
                      </option>
                    ))}
                  </Select>
                  <Button type="submit" variant="outline">
                    Salvar
                  </Button>
                </form>
              </div>
            </div>
          </article>
        ))}

        {leads.length === 0 && (
          <div className="rounded-xl border bg-background p-8 text-center text-muted-foreground">Nenhum lead encontrado.</div>
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
