import { describe, expect, it } from "vitest";
import { imageUrlSchema, parseImagesText, propertySchema } from "./validations";

const validPayload = {
  title: "Apartamento teste",
  description: "Descrição com mais de dez caracteres.",
  price: 500000,
  type: "APARTMENT",
  transactionType: "SALE",
  bedrooms: 2,
  bathrooms: 1,
  area: 70,
  city: "São Paulo",
  neighborhood: "Centro",
  address: "Rua das Flores, 123",
  images: ["/uploads/imovel-1/foto.webp"]
};

describe("propertySchema", () => {
  it("aceita um payload válido e aplica os padrões (status, featured, parkingSpaces...)", () => {
    const result = propertySchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("AVAILABLE");
      expect(result.data.featured).toBe(false);
      expect(result.data.parkingSpaces).toBe(0);
      expect(result.data.condoFee).toBeNull();
      expect(result.data.amenities).toEqual([]);
    }
  });

  it("rejeita título muito curto", () => {
    const result = propertySchema.safeParse({ ...validPayload, title: "Ap" });
    expect(result.success).toBe(false);
  });

  it("rejeita descrição muito curta", () => {
    const result = propertySchema.safeParse({ ...validPayload, description: "curta" });
    expect(result.success).toBe(false);
  });

  it("rejeita preço zero ou negativo", () => {
    expect(propertySchema.safeParse({ ...validPayload, price: 0 }).success).toBe(false);
    expect(propertySchema.safeParse({ ...validPayload, price: -100 }).success).toBe(false);
  });

  it("rejeita área zero ou negativa", () => {
    expect(propertySchema.safeParse({ ...validPayload, area: 0 }).success).toBe(false);
  });

  it("rejeita quartos/banheiros negativos", () => {
    expect(propertySchema.safeParse({ ...validPayload, bedrooms: -1 }).success).toBe(false);
    expect(propertySchema.safeParse({ ...validPayload, bathrooms: -1 }).success).toBe(false);
  });

  it("exige ao menos uma imagem", () => {
    expect(propertySchema.safeParse({ ...validPayload, images: [] }).success).toBe(false);
  });

  it("rejeita tipo, transação ou status fora do enum", () => {
    expect(propertySchema.safeParse({ ...validPayload, type: "BARCO" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...validPayload, transactionType: "PERMUTA" }).success).toBe(false);
    expect(propertySchema.safeParse({ ...validPayload, status: "EM_LEILAO" }).success).toBe(false);
  });

  it("rejeita amenidade que não existe no catálogo", () => {
    const result = propertySchema.safeParse({ ...validPayload, amenities: ["jacuzzi-no-telhado"] });
    expect(result.success).toBe(false);
  });

  it("condomínio/IPTU: vazio vira null, negativo é rejeitado", () => {
    expect(propertySchema.safeParse({ ...validPayload, condoFee: "" }).success).toBe(true);
    const parsed = propertySchema.safeParse({ ...validPayload, condoFee: "" });
    if (parsed.success) expect(parsed.data.condoFee).toBeNull();

    expect(propertySchema.safeParse({ ...validPayload, condoFee: -50 }).success).toBe(false);
  });

  it("coage strings 'on'/'true' para boolean nos campos de checkbox", () => {
    const result = propertySchema.safeParse({ ...validPayload, featured: "on", furnished: "true" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.featured).toBe(true);
      expect(result.data.furnished).toBe(true);
    }
  });
});

describe("imageUrlSchema", () => {
  it("aceita caminhos locais em /uploads/", () => {
    expect(imageUrlSchema.safeParse("/uploads/imovel-1/foto.webp").success).toBe(true);
  });

  it("aceita URLs externas válidas", () => {
    expect(imageUrlSchema.safeParse("https://images.unsplash.com/foto.jpg").success).toBe(true);
  });

  it("rejeita texto que não é path local nem URL válida", () => {
    expect(imageUrlSchema.safeParse("nem-url-nem-path").success).toBe(false);
  });
});

describe("parseImagesText", () => {
  it("separa por linha ou vírgula, remove espaços e vazios", () => {
    expect(parseImagesText("/uploads/a.webp\n/uploads/b.webp, /uploads/c.webp\n\n")).toEqual([
      "/uploads/a.webp",
      "/uploads/b.webp",
      "/uploads/c.webp"
    ]);
  });

  it("texto vazio vira lista vazia", () => {
    expect(parseImagesText("")).toEqual([]);
  });
});
