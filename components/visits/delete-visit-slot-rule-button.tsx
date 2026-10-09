"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteVisitSlotRuleAction } from "@/lib/visit-actions";

export function DeleteVisitSlotRuleButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Remover este horário de disponibilidade?")) return;
    startTransition(async () => {
      await deleteVisitSlotRuleAction(id);
    });
  }

  return (
    <Button type="button" variant="destructive" className="h-8 px-3" onClick={handleDelete} disabled={pending}>
      <Trash2 className="mr-1 h-4 w-4" /> {pending ? "..." : "Remover"}
    </Button>
  );
}
