"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "@/lib/actions";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Tem certeza que deseja deletar este imóvel?")) return;
    startTransition(async () => {
      await deletePropertyAction(id);
    });
  }

  return (
    <Button type="button" variant="destructive" className="h-8 px-3" onClick={handleDelete} disabled={pending}>
      <Trash2 className="mr-1 h-4 w-4" /> {pending ? "..." : "Deletar"}
    </Button>
  );
}
