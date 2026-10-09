"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelAlertByTokenAction } from "@/lib/alert-actions";

export function CancelAlertButton({ token }: { token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (result) {
    return (
      <p className="mt-4 flex items-center justify-center gap-2 text-sm text-foreground">
        {result.ok && <CheckCircle2 className="h-4 w-4 text-primary" />} {result.message}
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => startTransition(async () => setResult(await cancelAlertByTokenAction(token)))}
    >
      {pending ? "Cancelando..." : "Cancelar alerta"}
    </Button>
  );
}
