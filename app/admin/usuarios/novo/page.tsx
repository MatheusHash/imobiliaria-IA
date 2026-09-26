import { UserForm } from "@/components/users/user-form";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  await requireAdmin("/admin/usuarios/novo");

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Novo usuário</h1>
        <p className="mt-2 text-muted-foreground">Crie o acesso de um corretor ou administrador.</p>
      </div>
      <UserForm />
    </main>
  );
}
