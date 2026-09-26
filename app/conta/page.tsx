import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/users/change-password-form";
import { getCurrentUser } from "@/lib/auth";
import { roleLabels } from "@/lib/users";

export const dynamic = "force-dynamic";

// Fica fora de /admin de propósito: o layout do admin redireciona quem tem senha provisória
// para cá, e esta página precisa abrir mesmo nesse caso.
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/conta");

  return (
    <main className="container-page flex justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Minha conta</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{user.name ?? user.email}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.email} · {roleLabels[user.role]}
          </p>
        </div>

        {user.mustChangePassword && (
          <div className="mb-6 rounded-md border border-primary bg-secondary p-4 text-sm text-foreground">
            <strong>Primeiro acesso:</strong> defina uma senha pessoal para continuar. A senha provisória deixará de funcionar.
          </div>
        )}

        <ChangePasswordForm />

        {!user.mustChangePassword && (
          <p className="mt-6 text-center text-sm">
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/admin/imoveis">
              Voltar para o admin
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
