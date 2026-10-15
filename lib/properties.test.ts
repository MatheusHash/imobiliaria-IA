import { describe, expect, it } from "vitest";
import { buildPropertyWhere, parsePropertyCode, parseSort } from "./properties";

describe("buildPropertyWhere", () => {
  it("público: só mostra imóveis disponíveis, mesmo sem outros filtros", () => {
    expect(buildPropertyWhere({}, "public")).toEqual({ status: { in: ["AVAILABLE"] } });
  });

  it("admin: sem filtro de status, mostra todos", () => {
    expect(buildPropertyWhere({}, "admin")).toEqual({});
  });

  it("admin: filtra por um status específico quando pedido", () => {
    expect(buildPropertyWhere({ status: "SOLD" }, "admin")).toEqual({ status: "SOLD" });
  });

  it("admin: status inválido é ignorado (não filtra)", () => {
    expect(buildPropertyWhere({ status: "NAO_EXISTE" }, "admin")).toEqual({});
  });

  it("combina tipo, transação, cidade e bairro (case-insensitive)", () => {
    const where = buildPropertyWhere(
      { type: "HOUSE", transactionType: "RENT", city: "Campinas", neighborhood: "Centro" },
      "admin"
    );
    expect(where).toEqual({
      type: "HOUSE",
      transactionType: "RENT",
      city: { contains: "Campinas", mode: "insensitive" },
      neighborhood: { contains: "Centro", mode: "insensitive" }
    });
  });

  it("tipo e transação inválidos são ignorados, não quebram a query", () => {
    expect(buildPropertyWhere({ type: "INVALIDO", transactionType: "INVALIDO" }, "admin")).toEqual({});
  });

  it("quartos e vagas usam 'no mínimo' (gte); zero não filtra", () => {
    expect(buildPropertyWhere({ bedrooms: "2", parking: "1" }, "admin")).toEqual({
      bedrooms: { gte: 2 },
      parkingSpaces: { gte: 1 }
    });
    expect(buildPropertyWhere({ bedrooms: "0" }, "admin")).toEqual({});
  });

  it("faixa de preço: aceita só mínimo, só máximo, ou os dois", () => {
    expect(buildPropertyWhere({ minPrice: "100000" }, "admin")).toEqual({ price: { gte: 100000 } });
    expect(buildPropertyWhere({ maxPrice: "500000" }, "admin")).toEqual({ price: { lte: 500000 } });
    expect(buildPropertyWhere({ minPrice: "100000", maxPrice: "500000" }, "admin")).toEqual({
      price: { gte: 100000, lte: 500000 }
    });
  });

  it("faixa de preço inválida (não numérica) não filtra por preço", () => {
    expect(buildPropertyWhere({ minPrice: "abc", maxPrice: "xyz" }, "admin")).toEqual({});
  });

  it("filtra por código exato quando o código é válido", () => {
    expect(buildPropertyWhere({ code: "1001" }, "public")).toEqual({
      status: { in: ["AVAILABLE"] },
      code: 1001
    });
  });

  it("código inválido (não numérico) não filtra por código", () => {
    const where = buildPropertyWhere({ code: "abc" }, "admin");
    expect(where).not.toHaveProperty("code");
  });

  it("busca livre (q) procura no título e, se parece um código, também pelo código", () => {
    expect(buildPropertyWhere({ q: "1001" }, "public")).toEqual({
      status: { in: ["AVAILABLE"] },
      OR: [{ title: { contains: "1001", mode: "insensitive" } }, { code: 1001 }]
    });
    expect(buildPropertyWhere({ q: "Casa com jardim" }, "public")).toEqual({
      status: { in: ["AVAILABLE"] },
      OR: [{ title: { contains: "Casa com jardim", mode: "insensitive" } }]
    });
  });
});

describe("parseSort", () => {
  it("usa 'recent' como padrão para valor ausente ou desconhecido", () => {
    expect(parseSort(undefined)).toBe("recent");
    expect(parseSort("qualquer-coisa")).toBe("recent");
  });

  it("aceita as chaves válidas", () => {
    expect(parseSort("price-asc")).toBe("price-asc");
    expect(parseSort("price-desc")).toBe("price-desc");
  });
});

describe("parsePropertyCode", () => {
  it("converte uma string numérica em número", () => {
    expect(parsePropertyCode("1001")).toBe(1001);
  });

  it("retorna null para UUID, vazio ou não numérico", () => {
    expect(parsePropertyCode("550e8400-e29b-41d4-a716-446655440000")).toBeNull();
    expect(parsePropertyCode("")).toBeNull();
    expect(parsePropertyCode(undefined)).toBeNull();
    expect(parsePropertyCode(null)).toBeNull();
    expect(parsePropertyCode("abc")).toBeNull();
  });

  it("rejeita número com mais de 9 dígitos (limite da regex)", () => {
    expect(parsePropertyCode("1234567890")).toBeNull();
  });
});
