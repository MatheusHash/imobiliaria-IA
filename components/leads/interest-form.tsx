"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import { createLeadAction, type ActionState } from "@/lib/actions";
import { maskPhone } from "@/lib/utils";

const initialState: ActionState = {};

export function InterestForm({ propertyId, defaultMessage }: { propertyId: string; defaultMessage: string }) {
  const [state, formAction, pending] = useActionState(createLeadAction, initialState);
  const [phone, setPhone] = useState("");

  if (state.success) {
    return (
      <div className="mt-5 flex flex-col items-center gap-3 rounded-xl border bg-secondary p-6 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="font-semibold text-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input type="hidden" name="propertyId" value={propertyId} />
      {/* Honeypot: invisível para pessoas, preenchido por robôs de spam. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Site</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.message && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</div>}

      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={state.values?.name} required />
        <FieldError message={state.errors?.name?.[0]} />
      </div>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
        <FieldError message={state.errors?.email?.[0]} />
      </div>
      <div>
        <Label htmlFor="phone">Telefone / WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="(00) 00000-0000"
          value={phone}
          onChange={(event) => setPhone(maskPhone(event.target.value))}
          required
        />
        <FieldError message={state.errors?.phone?.[0]} />
      </div>
      <div>
        <Label htmlFor="message">Mensagem</Label>
        <Textarea id="message" name="message" defaultValue={state.values?.message ?? defaultMessage} />
        <FieldError message={state.errors?.message?.[0]} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar interesse"}
      </Button>
    </form>
  );
}
