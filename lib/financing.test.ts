import { describe, expect, it } from "vitest";
import { simulateFinancing } from "./financing";

const input = { price: 500_000, downPaymentPct: 20, months: 24, yearlyRatePct: 12 };

describe("simulateFinancing", () => {
  it("desconta a entrada do valor financiado", () => {
    const result = simulateFinancing(input, "PRICE");
    expect(result.downPayment).toBe(100_000);
    expect(result.financedAmount).toBe(400_000);
  });

  it("SAC: amortização constante, parcela decrescente, saldo zera no fim", () => {
    const result = simulateFinancing(input, "SAC");
    const amortizations = result.rows.map((row) => row.amortization);

    expect(new Set(amortizations).size).toBe(1); // mesma amortização todo mês
    expect(result.rows[0].payment).toBeGreaterThan(result.rows[result.rows.length - 1].payment);
    expect(result.rows[result.rows.length - 1].balance).toBe(0);
    expect(result.firstPayment).toBe(result.rows[0].payment);
    expect(result.lastPayment).toBe(result.rows[result.rows.length - 1].payment);
  });

  it("Price: parcela constante, saldo zera no fim", () => {
    const result = simulateFinancing(input, "PRICE");
    const payments = result.rows.map((row) => row.payment);

    // Tolerância de 1 centavo por arredondamento mês a mês.
    const max = Math.max(...payments);
    const min = Math.min(...payments);
    expect(max - min).toBeLessThanOrEqual(0.01);
    // Arredondar cada parcela ao centavo deixa um resíduo mínimo no saldo final —
    // esperado numa simulação aproximada, não num sistema de originação de crédito.
    expect(result.rows[result.rows.length - 1].balance).toBeLessThan(1);
  });

  it("taxa 0% a.a.: sem juros, parcela = valor financiado / meses", () => {
    const result = simulateFinancing({ ...input, yearlyRatePct: 0 }, "PRICE");
    expect(result.totalInterest).toBeLessThan(1);
    expect(result.firstPayment).toBeCloseTo(result.financedAmount / input.months, 2);
  });

  it("SAC e Price cobram o mesmo total financiado, mas Price distribui os juros de forma diferente", () => {
    const sac = simulateFinancing(input, "SAC");
    const price = simulateFinancing(input, "PRICE");

    expect(sac.financedAmount).toBe(price.financedAmount);
    // SAC concentra amortização mais cedo, então paga menos juros no total que a Price.
    expect(sac.totalInterest).toBeLessThan(price.totalInterest);
  });
});
