"use client";

import { useTransition } from "react";
import { toggleAlertAction } from "@/lib/alert-actions";

export function ToggleAlert({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const checked = event.target.checked;
    const formData = new FormData();
    if (checked) formData.set("active", "on");

    startTransition(async () => {
      await toggleAlertAction(id, formData);
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" className="h-4 w-4 rounded border-border" defaultChecked={active} onChange={handleChange} disabled={pending} />
      Ativo
    </label>
  );
}
