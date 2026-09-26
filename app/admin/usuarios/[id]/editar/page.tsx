import { notFound } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const currentUser = await requireAdmin(`/admin/usuarios/${id}/editar`);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, active: true }
  });
  if (!user) notFound();

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Editar usuário</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
      </div>
      <UserForm user={user} isSelf={user.id === currentUser.id} />
    </main>
  );
}
