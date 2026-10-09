import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { syncPortalListingAction, updatePortalListingsAction } from "@/lib/portal-actions";
import { getPortalListings, portalLabels, portalNames, portalSyncStatusLabels } from "@/lib/portals";

const statusColors = {
  PENDING: "bg-secondary text-muted-foreground",
  SYNCED: "bg-emerald-600 text-white",
  ERROR: "bg-red-600 text-white"
} as const;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export async function PortalListingsForm({ propertyId }: { propertyId: string }) {
  const listings = await getPortalListings(propertyId);
  const listingByPortal = new Map(listings.map((listing) => [listing.portal, listing]));

  return (
    <div className="mt-6 rounded-xl border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Portais</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Marque os portais em que este imóvel deve ser anunciado. A sincronização real ainda depende de qual
        portal/plano a imobiliária contrata — ver <code>docs/modulos.md</code>, módulo 8.
      </p>

      <form action={updatePortalListingsAction.bind(null, propertyId)} className="mt-4 space-y-3">
        {portalNames.map((portal) => {
          const listing = listingByPortal.get(portal);
          return (
            <div key={portal} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <input type="checkbox" name="portals" value={portal} defaultChecked={listing?.enabled ?? false} className="h-4 w-4 rounded border-border" />
                {portalLabels[portal]}
              </label>
              {listing && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge className={statusColors[listing.status]}>{portalSyncStatusLabels[listing.status]}</Badge>
                  {listing.lastSyncAt && <span>último envio: {dateFormatter.format(listing.lastSyncAt)}</span>}
                  {listing.lastError && <span className="max-w-xs text-red-600">{listing.lastError}</span>}
                </div>
              )}
            </div>
          );
        })}
        <Button type="submit" variant="outline">
          Salvar portais
        </Button>
      </form>

      {listings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {listings.map((listing) => (
            <form key={listing.id} action={syncPortalListingAction.bind(null, listing.id)}>
              <Button type="submit" variant="outline" className="h-8 px-3 text-xs">
                Sincronizar {portalLabels[listing.portal]}
              </Button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
