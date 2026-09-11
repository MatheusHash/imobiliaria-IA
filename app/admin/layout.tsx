import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions";
import { requireCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  return (
    <>
      <div className="border-b bg-slate-50">
        <div className="container-page flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Área administrativa</p>
            <p className="text-sm text-slate-600">Autenticado como {user.name ?? user.email}</p>
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
