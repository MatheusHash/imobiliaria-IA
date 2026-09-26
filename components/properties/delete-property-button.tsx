"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePropertyAction } from "@/lib/actions";

export function DeletePropertyButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Excluir este imóvel definitivamente?\n\nSe ele foi vendido, alugado ou saiu do ar, prefira editar e mudar o status: assim o histórico e o link continuam existindo.")) return;
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
