"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { createVisitSlotRuleAction } from "@/lib/visit-actions";

const initialState: ActionState = {};

const weekdayOptions = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" }
];

export function VisitSlotRuleForm() {
  const [state, formAction, pending] = useActionState(createVisitSlotRuleAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-xl border bg-background p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      {state.message && (
        <div className={`sm:col-span-2 lg:col-span-5 rounded-md p-3 text-sm ${state.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </div>
      )}

      <div>
        <Label htmlFor="weekday">Dia da semana</Label>
        <Select id="weekday" name="weekday" defaultValue={1}>
          {weekdayOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="startTime">Das</Label>
        <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
        <FieldError message={state.errors?.startTime?.[0]} />
      </div>
      <div>
        <Label htmlFor="endTime">Até</Label>
        <Input id="endTime" name="endTime" type="time" defaultValue="18:00" required />
        <FieldError message={state.errors?.endTime?.[0]} />
      </div>
      <div>
        <Label htmlFor="slotMinutes">Duração (min)</Label>
        <Input id="slotMinutes" name="slotMinutes" type="number" min="10" max="240" step="5" defaultValue={30} required />
        <FieldError message={state.errors?.slotMinutes?.[0]} />
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Adicionando..." : "Adicionar horário"}
        </Button>
      </div>
    </form>
  );
}
