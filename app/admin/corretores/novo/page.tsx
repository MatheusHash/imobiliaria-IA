import { UserForm } from "@/components/users/user-form";
import { requireAdmin } from "@/lib/auth";
import { requireModule } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function NewCorretorPage() {
  await requireAdmin("/admin/corretores/novo");
  await requireModule("corretores");

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Novo corretor</h1>
        <p className="mt-2 text-muted-foreground">Cadastre um corretor e crie o acesso dele à área administrativa.</p>
      </div>
      <UserForm />
    </main>
  );
}
