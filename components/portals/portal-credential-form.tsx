"use client";

import { useActionState } from "react";
import type { PortalName } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { updatePortalCredentialAction } from "@/lib/portal-actions";
import { portalLabels } from "@/lib/portals";

const initialState: ActionState = {};

export function PortalCredentialForm({ portal, initialConfig }: { portal: PortalName; initialConfig: object }) {
  const action = updatePortalCredentialAction.bind(null, portal);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="rounded-lg border p-4">
      <Label htmlFor={`config-${portal}`}>{portalLabels[portal]} — configuração (JSON)</Label>
      <Textarea
        id={`config-${portal}`}
        name="config"
        defaultValue={JSON.stringify(initialConfig, null, 2)}
        className="mt-1 font-mono text-xs"
        rows={4}
      />
      {state.message && <p className={`mt-1 text-xs ${state.success ? "text-emerald-700" : "text-red-600"}`}>{state.message}</p>}
      <Button type="submit" variant="outline" disabled={pending} className="mt-2 h-8 px-3 text-xs">
        {pending ? "Salvando..." : "Salvar credenciais"}
      </Button>
    </form>
  );
}
