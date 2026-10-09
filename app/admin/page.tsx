import Link from "next/link";
import { Eye, Home, Inbox, KeyRound, PencilLine } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { requireCurrentUser } from "@/lib/auth";
import { leadScope, leadStatusLabels } from "@/lib/leads";
import { requireModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { propertyStatusLabels } from "@/lib/property-status";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminDashboardPage() {
  // "/admin/imoveis" (essencial) é o destino seguro se o usuário não estiver logado;
  // módulo "indicadores" (adicional) é checado abaixo, já autenticado.
  const user = await requireCurrentUser("/admin/imoveis");
  await requireModule("indicadores");
  const scope = leadScope(user);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [statusCounts, newLeads, leadsThisWeek, leadCounts, topViewed, recentLeads] = await Promise.all([
    prisma.property.groupBy({ by: ["status"], _count: true }),
    prisma.lead.count({ where: { ...scope, status: "NEW" } }),
    prisma.lead.count({ where: { ...scope, createdAt: { gte: weekAgo } } }),
    prisma.lead.groupBy({ by: ["status"], where: scope, _count: true }),
    prisma.property.findMany({
      where: { viewCount: { gt: 0 } },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, code: true, title: true, status: true, viewCount: true, _count: { select: { leads: true } } }
    }),
    prisma.lead.findMany({
      where: scope,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true, property: { select: { code: true } } }
    })
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((item) => [item.status, item._count]));
  const leadsByStatus = Object.fromEntries(leadCounts.map((item) => [item.status, item._count]));

  const cards = [
    { label: "Disponíveis", value: byStatus.AVAILABLE ?? 0, icon: Home, href: "/admin/imoveis?status=AVAILABLE" },
    { label: "Reservados", value: byStatus.RESERVED ?? 0, icon: KeyRound, href: "/admin/imoveis?status=RESERVED" },
    { label: "Rascunhos", value: byStatus.DRAFT ?? 0, icon: PencilLine, href: "/admin/imoveis?status=DRAFT" },
    { label: "Leads novos", value: newLeads, icon: Inbox, href: "/admin/leads?status=NEW", hint: `${leadsThisWeek} nos últimos 7 dias` }
  ];

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user.name ?? user.email}</h1>
          <p className="mt-2 text-muted-foreground">Resumo dos imóveis e dos contatos de clientes.</p>
        </div>
        <LinkButton href="/admin/imoveis/novo">Novo imóvel</LinkButton>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl border bg-background p-5 shadow-sm transition hover:border-primary">
            <card.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 text-3xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm font-medium text-foreground">{card.label}</p>
            {card.hint && <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>}
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-background p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Imóveis mais vistos</h2>
          <p className="text-xs text-muted-foreground">Visitas de clientes à página do imóvel.</p>
          <ul className="mt-4 divide-y divide-border text-sm">
            {topViewed.map((property) => (
              <li key={property.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/admin/imoveis/${property.id}/editar`} className="min-w-0 truncate hover:text-primary">
                  <span className="font-mono text-muted-foreground">{property.code}</span> {property.title}
                  {property.status !== "AVAILABLE" && (
                    <span className="ml-2 text-xs text-muted-foreground">({propertyStatusLabels[property.status]})</span>
                  )}
                </Link>
                <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{property.viewCount}</span>
                  <span className="flex items-center gap-1"><Inbox className="h-4 w-4" />{property._count.leads}</span>
                </span>
              </li>
            ))}
            {topViewed.length === 0 && <li className="py-2 text-muted-foreground">Ainda não há visitas registradas.</li>}
          </ul>
        </section>

        <section className="rounded-xl border bg-background p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-foreground">Leads recentes</h2>
              <p className="text-xs text-muted-foreground">
                {(Object.keys(leadStatusLabels) as (keyof typeof leadStatusLabels)[])
                  .map((status) => `${leadStatusLabels[status]}: ${leadsByStatus[status] ?? 0}`)
                  .join(" · ")}
              </p>
            </div>
            <Link href="/admin/leads" className="shrink-0 text-sm font-medium text-primary hover:underline">Ver todos</Link>
          </div>
          <ul className="mt-4 divide-y divide-border text-sm">
            {recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  <span className="font-medium text-foreground">{lead.name}</span>
                  {lead.property && <span className="text-muted-foreground"> · imóvel {lead.property.code}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {leadStatusLabels[lead.status]} · {dateFormatter.format(lead.createdAt)}
                </span>
              </li>
            ))}
            {recentLeads.length === 0 && <li className="py-2 text-muted-foreground">Nenhum lead ainda.</li>}
          </ul>
        </section>
      </div>
    </main>
  );
}
