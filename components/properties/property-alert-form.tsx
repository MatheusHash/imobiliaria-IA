"use client";

import { useActionState, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { subscribeToAlertAction } from "@/lib/alert-actions";
import { describeAlertFilters, type AlertFilters } from "@/lib/alerts";

const initialState: ActionState = {};

export function PropertyAlertForm({ filters }: { filters: AlertFilters }) {
  const [state, formAction, pending] = useActionState(subscribeToAlertAction, initialState);
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-secondary px-4 py-2 text-sm text-foreground">
        <CheckCircle2 className="h-4 w-4 text-primary" /> {state.message}
      </div>
    );
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" /> Me avise de novos imóveis assim
      </Button>
    );
  }

  return (
    <form action={formAction} className="w-full max-w-md rounded-lg border bg-background p-4">
      {/* Honeypot: invisível para pessoas, preenchido por robôs de spam. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="alert-website">Site</label>
        <input id="alert-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {Object.entries(filters).map(
        ([key, value]) => value && <input key={key} type="hidden" name={key} value={value} />
      )}

      <p className="text-sm text-foreground">
        Avisamos por e-mail quando surgir um imóvel assim: <strong>{describeAlertFilters(filters)}</strong>
      </p>

      {state.message && <p className="mt-2 text-sm text-red-600">{state.message}</p>}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          name="email"
          placeholder="seu@email.com"
          defaultValue={state.values?.email}
          required
          className="sm:flex-1"
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "Enviando..." : "Quero ser avisado"}
        </Button>
      </div>
      <FieldError message={state.errors?.email?.[0]} />
      <label className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-border" />
        Concordo em receber e-mails sobre novos imóveis com este filtro. Posso cancelar quando quiser.
      </label>
    </form>
  );
}
