"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import type { Role } from "@prisma/client";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import type { ActionState } from "@/lib/actions";
import { createUserAction, updateUserAction } from "@/lib/user-actions";
import { maskPhone } from "@/lib/utils";

const initialState: ActionState = {};

type EditableUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  creci: string | null;
  photo: string | null;
  role: Role;
  active: boolean;
};

export function UserForm({ user, isSelf = false }: { user?: EditableUser; isSelf?: boolean }) {
  const action = user ? updateUserAction.bind(null, user.id) : createUserAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [photo, setPhoto] = useState(user?.photo ?? "");
  const [uploading, setUploading] = useState(false);
  const error = (field: string) => state.errors?.[field]?.[0];

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("kind", "avatar");

      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message ?? "Erro ao enviar a foto");
        return;
      }

      setPhoto(data.paths[0]);
    } catch {
      alert("Erro ao enviar a foto");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
      {state.message && (
        <div className={state.success ? "rounded-md bg-emerald-50 p-3 text-sm text-emerald-700" : "rounded-md bg-red-50 p-3 text-sm text-red-700"}>
          {state.message}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-secondary">
          {photo ? (
            <Image src={photo} alt="Foto de perfil" fill className="object-cover" sizes="96px" />
          ) : (
            <UserRound className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Foto de perfil</Label>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border px-3 text-sm font-medium hover:bg-secondary">
              {uploading ? "Enviando..." : photo ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
            {photo && (
              <Button type="button" variant="outline" className="h-9" onClick={() => setPhoto("")} disabled={uploading}>
                Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">A imagem é recortada em formato quadrado.</p>
          <input type="hidden" name="photo" value={photo} />
          <FieldError message={error("photo")} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input id="name" name="name" defaultValue={state.values?.name ?? user?.name ?? ""} required />
          <FieldError message={error("name")} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={state.values?.email ?? user?.email ?? ""} required />
          <FieldError message={error("email")} />
        </div>
        <div>
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(event) => setPhone(maskPhone(event.target.value))}
          />
          <FieldError message={error("phone")} />
        </div>
        <div>
          <Label htmlFor="creci">CRECI</Label>
          <Input id="creci" name="creci" placeholder="Ex.: 12345-F/SP" defaultValue={state.values?.creci ?? user?.creci ?? ""} />
          <FieldError message={error("creci")} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="role">Papel</Label>
          <Select id="role" name="role" defaultValue={state.values?.role ?? user?.role ?? "CORRETOR"} disabled={isSelf}>
            <option value="CORRETOR">Corretor — gerencia imóveis e os próprios leads</option>
            <option value="ADMIN">Administrador — acesso total, inclusive corretores</option>
          </Select>
          {/* Campo desabilitado não é enviado; mantém o papel atual da própria conta. */}
          {isSelf && <input type="hidden" name="role" value={user?.role} />}
          <FieldError message={error("role")} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="password">{user ? "Nova senha provisória (opcional)" : "Senha provisória"}</Label>
          <Input id="password" name="password" type="text" autoComplete="off" required={!user} />
          <p className="mt-1 text-xs text-muted-foreground">
            {user
              ? "Preencha só para redefinir a senha. O corretor precisará trocá-la no próximo acesso."
              : "Informe esta senha ao corretor. Ele precisará trocá-la no primeiro acesso."}
          </p>
          <FieldError message={error("password")} />
        </div>
        {user && (
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
            <input type="checkbox" name="active" defaultChecked={user.active} disabled={isSelf} className="h-4 w-4" />
            Corretor ativo (desmarque para bloquear o acesso)
            {isSelf && <input type="hidden" name="active" value="on" />}
          </label>
        )}
      </div>

      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Salvando..." : user ? "Salvar alterações" : "Cadastrar corretor"}
      </Button>
    </form>
  );
}
