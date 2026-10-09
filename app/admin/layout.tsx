import { LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";
import { requireCurrentUser } from "@/lib/auth";
import { leadScope } from "@/lib/leads";
import { isModuleEnabled } from "@/lib/modules";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser("/admin/imoveis");
  const [newLeads, indicadoresLigado, corretoresLigado, financiamentoLigado, visitasLigado, alertasLigado, portaisLigado] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW", ...leadScope(user) } }),
    isModuleEnabled("indicadores"),
    isModuleEnabled("corretores"),
    isModuleEnabled("financiamento"),
    isModuleEnabled("visitas"),
    isModuleEnabled("alertas"),
    isModuleEnabled("portais")
  ]);

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
                ...(indicadoresLigado ? [{ href: "/admin", label: "Painel", exact: true }] : []),
                { href: "/admin/imoveis", label: "Imóveis" },
                { href: "/admin/leads", label: "Leads", badge: newLeads },
                ...(visitasLigado ? [{ href: "/admin/visitas", label: "Visitas" }] : []),
                ...(user.role === "ADMIN" && corretoresLigado ? [{ href: "/admin/corretores", label: "Corretores" }] : []),
                ...(user.role === "ADMIN" && financiamentoLigado ? [{ href: "/admin/financiamento", label: "Financiamento" }] : []),
                ...(user.role === "ADMIN" && alertasLigado ? [{ href: "/admin/alertas", label: "Alertas" }] : []),
                ...(user.role === "ADMIN" && portaisLigado ? [{ href: "/admin/portais", label: "Portais" }] : []),
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
