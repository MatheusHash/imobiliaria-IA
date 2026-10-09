import { ToggleAlert } from "@/components/alerts/toggle-alert";
import { requireAdmin } from "@/lib/auth";
import { describeAlertFilters, type AlertFilters } from "@/lib/alerts";
import { requireModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminAlertasPage() {
  await requireAdmin("/admin/alertas");
  await requireModule("alertas");

  const alerts = await prisma.propertyAlert.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Alertas de novos imóveis</h1>
        <p className="mt-2 text-muted-foreground">
          Clientes avisados por e-mail quando surge um imóvel novo com o filtro escolhido. Desative um alerta reportado como abuso.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
              <tr>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Filtro</th>
                <th className="px-4 py-3">Confirmado</th>
                <th className="px-4 py-3">Último aviso</th>
                <th className="px-4 py-3">Criado em</th>
                <th className="px-4 py-3">Ativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alerts.map((alert) => (
                <tr key={alert.id} className={alert.active ? "" : "text-muted-foreground"}>
                  <td className="px-4 py-3 font-medium">{alert.email}</td>
                  <td className="px-4 py-3">{describeAlertFilters(alert.filters as AlertFilters)}</td>
                  <td className="px-4 py-3">{alert.confirmed ? "Sim" : "Aguardando"}</td>
                  <td className="px-4 py-3">{alert.lastNotifiedAt ? dateFormatter.format(alert.lastNotifiedAt) : "—"}</td>
                  <td className="px-4 py-3">{dateFormatter.format(alert.createdAt)}</td>
                  <td className="px-4 py-3">
                    <ToggleAlert id={alert.id} active={alert.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {alerts.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum alerta cadastrado ainda.</div>}
      </div>
    </main>
  );
}
