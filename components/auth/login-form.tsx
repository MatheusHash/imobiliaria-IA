"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import { loginAction, type ActionState } from "@/lib/actions";

const initialState: ActionState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <input type="hidden" name="next" value={next} />

      {state.message && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="admin@primelar.com" required />
        <FieldError message={state.errors?.email?.[0]} />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError message={state.errors?.password?.[0]} />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
