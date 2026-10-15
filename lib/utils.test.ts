import { describe, expect, it } from "vitest";
import { formatCurrency, maskPhone, propertyTypeLabel, transactionTypeLabel } from "./utils";

// Intl.NumberFormat("pt-BR", { style: "currency" }) usa espaço não separável (U+00A0)
// entre "R$" e o valor — não é um espaço comum.
const NBSP = " ";

describe("formatCurrency", () => {
  it("formata um valor de venda sem sufixo", () => {
    expect(formatCurrency(500000, "SALE")).toBe(`R$${NBSP}500.000`);
  });

  it("formata um valor de aluguel com sufixo '/mês'", () => {
    expect(formatCurrency(1800, "RENT")).toBe(`R$${NBSP}1.800/mês`);
  });

  it("sem transactionType, não adiciona sufixo", () => {
    expect(formatCurrency(1000)).toBe(`R$${NBSP}1.000`);
  });
});

describe("propertyTypeLabel / transactionTypeLabel", () => {
  it("traduz os tipos conhecidos", () => {
    expect(propertyTypeLabel("APARTMENT")).toBe("Apartamento");
    expect(propertyTypeLabel("LAND")).toBe("Terreno");
    expect(transactionTypeLabel("SALE")).toBe("Venda");
    expect(transactionTypeLabel("RENT")).toBe("Aluguel");
  });

  it("devolve o valor original para um tipo desconhecido (nunca quebra a UI)", () => {
    expect(propertyTypeLabel("OUTRO")).toBe("OUTRO");
    expect(transactionTypeLabel("OUTRO")).toBe("OUTRO");
  });
});

describe("maskPhone", () => {
  it("aplica a máscara progressivamente conforme os dígitos chegam", () => {
    expect(maskPhone("3")).toBe("(3");
    expect(maskPhone("35")).toBe("(35");
    expect(maskPhone("3533")).toBe("(35) 33");
    expect(maskPhone("353333444")).toBe("(35) 3333-444");
  });

  it("formata telefone fixo (10 dígitos)", () => {
    expect(maskPhone("3533334444")).toBe("(35) 3333-4444");
  });

  it("formata celular (11 dígitos)", () => {
    expect(maskPhone("35999998888")).toBe("(35) 99999-8888");
  });

  it("ignora caracteres não numéricos e corta após 11 dígitos", () => {
    expect(maskPhone("(35) 99999-8888 extra")).toBe("(35) 99999-8888");
  });

  it("string vazia vira string vazia", () => {
    expect(maskPhone("")).toBe("");
  });
});
