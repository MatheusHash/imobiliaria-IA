import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";
import { requireCurrentUser } from "@/lib/auth";
import { leadScope } from "@/lib/leads";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();
  const newLeads = await prisma.lead.count({ where: { status: "NEW", ...leadScope(user) } });

  return (
    <>
      <div className="border-b bg-background">
        <div className="container-page flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <div>
              <p className="text-sm font-semibold text-foreground">Área administrativa</p>
              <p className="text-sm text-muted-foreground">Autenticado como {user.name ?? user.email}</p>
            </div>
            <AdminNav
              items={[
                { href: "/admin", label: "Painel", exact: true },
                { href: "/admin/imoveis", label: "Imóveis" },
                { href: "/admin/leads", label: "Leads", badge: newLeads },
                ...(user.role === "ADMIN" ? [{ href: "/admin/usuarios", label: "Usuários" }] : []),
                { href: "/conta", label: "Minha conta" }
              ]}
            />
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </form>
        </div>
      </div>
      {children}
    </>
  );
}
