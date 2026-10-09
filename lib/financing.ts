import { z } from "zod";

// Cálculo de amortização SAC e Price. Determinístico, sem integração externa —
// ver docs/modulos.md, módulo 9. Arquivo sem dependência de Prisma: pode ser
// importado tanto no servidor quanto em componentes client-side.

export const simulationInputSchema = z.object({
  price: z.number().positive(),
  downPaymentPct: z.number().min(0).max(90),
  months: z.number().int().min(12).max(480),
  yearlyRatePct: z.number().min(0).max(50)
});

export type SimulationInput = z.infer<typeof simulationInputSchema>;

export type AmortizationSystem = "SAC" | "PRICE";

export type InstallmentRow = {
  month: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
};

export type SimulationResult = {
  financedAmount: number;
  downPayment: number;
  firstPayment: number;
  lastPayment: number;
  totalPaid: number;
  totalInterest: number;
  rows: InstallmentRow[];
};

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

/** Taxa anual (%) convertida para a taxa mensal equivalente, por juros compostos. */
function yearlyPctToMonthlyRate(yearlyRatePct: number) {
  return Math.pow(1 + yearlyRatePct / 100, 1 / 12) - 1;
}

/**
 * Simula as parcelas de um financiamento pelo sistema SAC (amortização constante)
 * ou Price (parcela constante). `input.price` é o valor do imóvel; a entrada é
 * descontada antes de calcular o valor financiado.
 */
export function simulateFinancing(input: SimulationInput, system: AmortizationSystem): SimulationResult {
  const downPayment = round2((input.price * input.downPaymentPct) / 100);
  const financedAmount = round2(input.price - downPayment);
  const monthlyRate = yearlyPctToMonthlyRate(input.yearlyRatePct);

  const sacAmortization = financedAmount / input.months;
  const pricePayment =
    system === "PRICE"
      ? monthlyRate === 0
        ? financedAmount / input.months
        : (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -input.months))
      : 0;

  const rows: InstallmentRow[] = [];
  let balance = financedAmount;
  let totalPaid = 0;

  for (let month = 1; month <= input.months; month++) {
    const interest = round2(balance * monthlyRate);
    const amortization = round2(system === "SAC" ? sacAmortization : pricePayment - interest);
    const payment = round2(system === "SAC" ? amortization + interest : pricePayment);
    balance = round2(Math.max(balance - amortization, 0));
    totalPaid += payment;
    rows.push({ month, payment, interest, amortization, balance });
  }

  return {
    financedAmount,
    downPayment,
    firstPayment: rows[0]?.payment ?? 0,
    lastPayment: rows[rows.length - 1]?.payment ?? 0,
    totalPaid: round2(totalPaid),
    totalInterest: round2(totalPaid - financedAmount),
    rows
  };
}
