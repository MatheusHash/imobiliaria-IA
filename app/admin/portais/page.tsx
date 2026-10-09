import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalCredentialForm } from "@/components/portals/portal-credential-form";
import { requireAdmin } from "@/lib/auth";
import { requireModule } from "@/lib/modules";
import { prisma } from "@/lib/prisma";
import { syncAllPortalListingsAction, syncPortalListingAction } from "@/lib/portal-actions";
import { getPortalCredentials, portalLabels, portalSyncStatusLabels } from "@/lib/portals";

export const dynamic = "force-dynamic";

const statusColors = {
  PENDING: "bg-secondary text-muted-foreground",
  SYNCED: "bg-emerald-600 text-white",
  ERROR: "bg-red-600 text-white"
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminPortaisPage() {
  await requireAdmin("/admin/portais");
  await requireModule("portais");

  const [listings, credentials] = await Promise.all([
    prisma.portalListing.findMany({
      where: { enabled: true },
      include: { property: { select: { code: true, title: true } } },
      orderBy: [{ portal: "asc" }]
    }),
    getPortalCredentials()
  ]);

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Integração com portais</h1>
        <p className="mt-2 text-muted-foreground">
          Envio de anúncios para ZAP, VivaReal e OLX. O formato real de cada portal ainda não está definido — ver{" "}
          <code>docs/modulos.md</code>, módulo 8. Por enquanto, sincronizar sempre devolve um erro documentado.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Credenciais</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {credentials.map(({ portal, config }) => (
            <PortalCredentialForm key={portal} portal={portal} initialConfig={config as object} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Imóveis marcados para envio</h2>
          {listings.length > 0 && (
            <form action={syncAllPortalListingsAction}>
              <Button type="submit" variant="outline" className="h-8 px-3 text-xs">
                Sincronizar tudo
              </Button>
            </form>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
                <tr>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Último envio</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-4 py-3">
                      {listing.property ? (
                        <Link className="font-medium text-foreground hover:text-primary" href={`/admin/imoveis/${listing.propertyId}/editar`}>
                          {listing.property.code} · {listing.property.title}
                        </Link>
                      ) : (
                        <span className="italic text-muted-foreground">imóvel excluído</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{portalLabels[listing.portal]}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[listing.status]}>{portalSyncStatusLabels[listing.status]}</Badge>
                      {listing.lastError && <p className="mt-1 max-w-xs text-xs text-red-600">{listing.lastError}</p>}
                    </td>
                    <td className="px-4 py-3">{listing.lastSyncAt ? dateFormatter.format(listing.lastSyncAt) : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={syncPortalListingAction.bind(null, listing.id)}>
                        <Button type="submit" variant="outline" className="h-8 px-3 text-xs">
                          Sincronizar
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {listings.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum imóvel marcado para envio ainda — marque os portais na edição do imóvel.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
