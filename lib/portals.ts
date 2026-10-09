import { PortalName, PortalSyncStatus } from "@prisma/client";
import { prisma } from "./prisma";

export const portalLabels: Record<PortalName, string> = {
  ZAP: "ZAP Imóveis",
  VIVAREAL: "VivaReal",
  OLX: "OLX"
};

export const portalNames = Object.keys(portalLabels) as PortalName[];

export const portalSyncStatusLabels: Record<PortalSyncStatus, string> = {
  PENDING: "Pendente",
  SYNCED: "Sincronizado",
  ERROR: "Erro"
};

/**
 * Mensagem fixa: o formato real de cada portal (feed XML vs. API, campos exigidos)
 * depende de qual portal/plano a imobiliária-cliente contrata, decisão ainda pendente
 * (ver docs/modulos.md, módulo 8, pergunta 5.4). Até lá, toda sincronização termina
 * em erro documentado — o modelo de dados, a tela admin e o fluxo de status já
 * funcionam de ponta a ponta, prontos para receber o gerador de feed real depois.
 */
const NOT_IMPLEMENTED_MESSAGE =
  "Integração ainda não configurada: falta definir o portal/plano contratado (ver docs/modulos.md, pergunta 5.4).";

/** Grava, para cada portal, se o imóvel deve ser anunciado nele (cria a linha se não existir). */
export async function setPortalListings(propertyId: string, enabledPortals: PortalName[]) {
  const enabledSet = new Set(enabledPortals);

  await Promise.all(
    portalNames.map((portal) =>
      prisma.portalListing.upsert({
        where: { propertyId_portal: { propertyId, portal } },
        create: { propertyId, portal, enabled: enabledSet.has(portal) },
        update: { enabled: enabledSet.has(portal) }
      })
    )
  );
}

export async function getPortalListings(propertyId: string) {
  return prisma.portalListing.findMany({ where: { propertyId }, orderBy: { portal: "asc" } });
}

/** Placeholder: ver NOT_IMPLEMENTED_MESSAGE. Mantém o fluxo real (grava status/erro). */
export async function syncPortalListing(id: string) {
  await prisma.portalListing.update({
    where: { id },
    data: { status: "ERROR", lastError: NOT_IMPLEMENTED_MESSAGE, lastSyncAt: new Date() }
  });
}

/** Sincroniza todos os anúncios habilitados — usado pelo job agendado (scripts/sync-portals.ts). */
export async function syncAllEnabledListings() {
  const listings = await prisma.portalListing.findMany({ where: { enabled: true } });
  for (const listing of listings) {
    await syncPortalListing(listing.id);
  }
  return { synced: listings.length };
}

export async function getPortalCredentials() {
  const saved = await prisma.portalCredential.findMany();
  const byPortal = new Map(saved.map((credential) => [credential.portal, credential]));

  return portalNames.map((portal) => ({
    portal,
    config: byPortal.get(portal)?.config ?? {},
    updatedAt: byPortal.get(portal)?.updatedAt ?? null
  }));
}

export async function upsertPortalCredential(portal: PortalName, config: object) {
  await prisma.portalCredential.upsert({
    where: { portal },
    create: { portal, config },
    update: { config }
  });
}
