"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { changeOwnPasswordAction } from "@/lib/user-actions";

const initialState: ActionState = {};

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changeOwnPasswordAction, initialState);
  const error = (field: string) => state.errors?.[field]?.[0];

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-background p-6 shadow-sm">
      {state.message && (
        <div className={state.success ? "rounded-md bg-emerald-50 p-3 text-sm text-emerald-700" : "rounded-md bg-red-50 p-3 text-sm text-red-700"}>
          {state.message}
        </div>
      )}
      <div>
        <Label htmlFor="currentPassword">Senha atual</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
        <FieldError message={error("currentPassword")} />
      </div>
      <div>
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError message={error("newPassword")} />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
        <FieldError message={error("confirmPassword")} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
