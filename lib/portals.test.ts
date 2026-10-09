import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import {
  getPortalCredentials,
  getPortalListings,
  portalNames,
  setPortalListings,
  syncAllEnabledListings,
  syncPortalListing,
  upsertPortalCredential
} from "./portals";

async function createTestProperty() {
  return prisma.property.create({
    data: {
      title: "Imóvel de teste (portais)",
      description: "Descrição de teste",
      price: 100000,
      type: "APARTMENT",
      transactionType: "SALE",
      bedrooms: 1,
      bathrooms: 1,
      area: 10,
      city: "Cidade Teste",
      neighborhood: "Bairro Teste",
      address: "Rua Teste, 1",
      status: "DRAFT",
      images: ["/uploads/seed-1/img-1.svg"]
    }
  });
}

describe("portals (integração, banco local)", () => {
  let propertyId: string;

  beforeEach(async () => {
    const property = await createTestProperty();
    propertyId = property.id;
  });

  afterEach(async () => {
    await prisma.portalListing.deleteMany({ where: { propertyId } });
    await prisma.property.delete({ where: { id: propertyId } });
  });

  it("setPortalListings cria uma linha por portal, refletindo enabled", async () => {
    await setPortalListings(propertyId, ["ZAP", "OLX"]);
    const listings = await getPortalListings(propertyId);

    expect(listings).toHaveLength(portalNames.length);
    const byPortal = Object.fromEntries(listings.map((listing) => [listing.portal, listing.enabled]));
    expect(byPortal.ZAP).toBe(true);
    expect(byPortal.OLX).toBe(true);
    expect(byPortal.VIVAREAL).toBe(false);
  });

  it("chamar de novo atualiza (upsert), não duplica linhas", async () => {
    await setPortalListings(propertyId, ["ZAP"]);
    await setPortalListings(propertyId, ["VIVAREAL"]);

    const listings = await getPortalListings(propertyId);
    expect(listings).toHaveLength(portalNames.length);
    const byPortal = Object.fromEntries(listings.map((listing) => [listing.portal, listing.enabled]));
    expect(byPortal.ZAP).toBe(false);
    expect(byPortal.VIVAREAL).toBe(true);
  });

  it("syncPortalListing grava status ERROR com a mensagem documentada (placeholder)", async () => {
    await setPortalListings(propertyId, ["ZAP"]);
    const [listing] = await getPortalListings(propertyId);

    await syncPortalListing(listing.id);

    const updated = await prisma.portalListing.findUnique({ where: { id: listing.id } });
    expect(updated?.status).toBe("ERROR");
    expect(updated?.lastError).toContain("ainda não configurada");
    expect(updated?.lastSyncAt).not.toBeNull();
  });

  it("syncAllEnabledListings só processa quem está enabled", async () => {
    await setPortalListings(propertyId, ["ZAP"]); // só ZAP fica enabled=true

    const result = await syncAllEnabledListings();
    expect(result.synced).toBeGreaterThanOrEqual(1);

    const listings = await getPortalListings(propertyId);
    const zap = listings.find((listing) => listing.portal === "ZAP");
    const olx = listings.find((listing) => listing.portal === "OLX");
    expect(zap?.status).toBe("ERROR"); // sincronizado (com erro documentado)
    expect(olx?.status).toBe("PENDING"); // nunca tocado, porque enabled=false
  });
});

describe("portal credentials (integração, banco local)", () => {
  afterEach(async () => {
    await prisma.portalCredential.deleteMany({ where: { portal: "ZAP" } });
  });

  it("getPortalCredentials devolve {} para portal sem configuração salva", async () => {
    const credentials = await getPortalCredentials();
    const zap = credentials.find((credential) => credential.portal === "ZAP");
    expect(zap?.config).toEqual({});
  });

  it("upsertPortalCredential grava e sobrescreve", async () => {
    await upsertPortalCredential("ZAP", { token: "abc" });
    let credentials = await getPortalCredentials();
    expect(credentials.find((c) => c.portal === "ZAP")?.config).toEqual({ token: "abc" });

    await upsertPortalCredential("ZAP", { token: "def" });
    credentials = await getPortalCredentials();
    expect(credentials.find((c) => c.portal === "ZAP")?.config).toEqual({ token: "def" });
  });
});
