"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/currency";
import { simulateFinancing, type AmortizationSystem } from "@/lib/financing";
import { cn } from "@/lib/utils";

type FinancingSimulatorProps = {
  price: number;
  defaultRateYearly: number;
  minDownPaymentPct: number;
  maxMonths: number;
};

export function FinancingSimulator({ price, defaultRateYearly, minDownPaymentPct, maxMonths }: FinancingSimulatorProps) {
  const [system, setSystem] = useState<AmortizationSystem>("PRICE");
  const [downPaymentPct, setDownPaymentPct] = useState(minDownPaymentPct);
  const [months, setMonths] = useState(Math.min(360, maxMonths));
  const [yearlyRatePct, setYearlyRatePct] = useState(defaultRateYearly);

  const result = useMemo(() => {
    if (downPaymentPct < 0 || downPaymentPct > 90) return null;
    if (months < 12 || months > maxMonths) return null;
    if (yearlyRatePct < 0 || yearlyRatePct > 50) return null;

    return simulateFinancing({ price, downPaymentPct, months, yearlyRatePct }, system);
  }, [price, downPaymentPct, months, yearlyRatePct, system, maxMonths]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold">Simule seu financiamento</h2>
      <p className="mt-1 text-sm text-muted-foreground">Estimativa aproximada, sem compromisso — sujeita à análise e aprovação do banco.</p>

      <div className="mt-4 rounded-xl border bg-background p-6">
        <div className="mb-4 flex gap-2">
          <Button type="button" variant={system === "PRICE" ? "default" : "outline"} onClick={() => setSystem("PRICE")} className="flex-1">
            Tabela Price
          </Button>
          <Button type="button" variant={system === "SAC" ? "default" : "outline"} onClick={() => setSystem("SAC")} className="flex-1">
            Tabela SAC
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SimulatorField
            label="Entrada (%)"
            value={downPaymentPct}
            min={0}
            max={90}
            step={1}
            onChange={setDownPaymentPct}
          />
          <SimulatorField label="Prazo (meses)" value={months} min={12} max={maxMonths} step={1} onChange={setMonths} />
          <SimulatorField label="Taxa (% a.a.)" value={yearlyRatePct} min={0} max={50} step={0.1} onChange={setYearlyRatePct} />
        </div>

        {result ? (
          <div className="mt-6 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
            <Stat label="Valor financiado" value={formatBRL(result.financedAmount)} />
            <Stat label="Entrada" value={formatBRL(result.downPayment)} />
            <Stat label={system === "SAC" ? "1ª parcela" : "Parcela"} value={formatBRL(result.firstPayment)} />
            {system === "SAC" && <Stat label="Última parcela" value={formatBRL(result.lastPayment)} />}
            <Stat label="Total de juros" value={formatBRL(result.totalInterest)} />
            <Stat label="Total pago" value={formatBRL(result.totalPaid)} />
          </div>
        ) : (
          <p className="mt-6 border-t pt-4 text-sm text-red-600">Revise os valores informados.</p>
        )}
      </div>
    </div>
  );
}

function SimulatorField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm">
      <span className="font-medium text-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none",
          "focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
