"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { updateFinancingSettingsAction } from "@/lib/financing-actions";
import type { FinancingSettingsInput } from "@/lib/financing-settings";

const initialState: ActionState = {};

export function FinancingSettingsForm({ settings }: { settings: FinancingSettingsInput }) {
  const [state, formAction, pending] = useActionState(updateFinancingSettingsAction, initialState);

  return (
    <form action={formAction} className="max-w-md space-y-4 rounded-xl border bg-background p-6 shadow-sm">
      {state.message && (
        <div className={`rounded-md p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </div>
      )}

      <div>
        <Label htmlFor="defaultRateYearly">Taxa de juros sugerida (% ao ano)</Label>
        <Input
          id="defaultRateYearly"
          name="defaultRateYearly"
          type="number"
          step="0.01"
          min="0.1"
          max="50"
          defaultValue={settings.defaultRateYearly}
          required
        />
        <FieldError message={state.errors?.defaultRateYearly?.[0]} />
      </div>

      <div>
        <Label htmlFor="minDownPaymentPct">Entrada mínima sugerida (%)</Label>
        <Input
          id="minDownPaymentPct"
          name="minDownPaymentPct"
          type="number"
          step="0.01"
          min="0"
          max="90"
          defaultValue={settings.minDownPaymentPct}
          required
        />
        <FieldError message={state.errors?.minDownPaymentPct?.[0]} />
      </div>

      <div>
        <Label htmlFor="maxMonths">Prazo máximo (meses)</Label>
        <Input id="maxMonths" name="maxMonths" type="number" step="1" min="12" max="480" defaultValue={settings.maxMonths} required />
        <FieldError message={state.errors?.maxMonths?.[0]} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
