import Image from "next/image";
import Link from "next/link";
import { Pencil, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/users";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ created?: string }> };

export default async function AdminCorretoresPage({ searchParams }: PageProps) {
  const currentUser = await requireAdmin("/admin/corretores");
  const { created } = await searchParams;

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      creci: true,
      photo: true,
      role: true,
      active: true,
      mustChangePassword: true,
      _count: { select: { assignedLeads: true } }
    }
  });

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
          <h1 className="text-3xl font-bold text-foreground">Corretores</h1>
          <p className="mt-2 text-muted-foreground">Equipe com acesso à área administrativa.</p>
        </div>
        <LinkButton href="/admin/corretores/novo">Novo corretor</LinkButton>
      </div>

      {created && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Corretor cadastrado. Informe a senha provisória a ele — a troca será pedida no primeiro acesso.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wide text-primary">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">CRECI</th>
                <th className="px-4 py-3">Papel</th>
                <th className="px-4 py-3">Situação</th>
                <th className="px-4 py-3">Leads</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className={user.active ? "hover:bg-secondary" : "text-muted-foreground hover:bg-secondary"}>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary">
                        {user.photo ? (
                          <Image src={user.photo} alt="" fill className="object-cover" sizes="36px" />
                        ) : (
                          <UserRound className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span>
                        {user.name ?? "—"}
                        {user.id === currentUser.id && <span className="ml-2 text-xs text-muted-foreground">(você)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3">{user.creci ?? "—"}</td>
                  <td className="px-4 py-3">{roleLabels[user.role]}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge className={user.active ? "bg-emerald-600 text-white" : ""}>{user.active ? "Ativo" : "Desativado"}</Badge>
                      {user.mustChangePassword && <Badge>Senha provisória</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{user._count.assignedLeads}</td>
                  <td className="px-4 py-3 text-right">
                    <Link className="inline-flex h-8 items-center rounded-md border px-3 hover:bg-secondary" href={`/admin/corretores/${user.id}/editar`}>
                      <Pencil className="mr-1 h-4 w-4" />
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
