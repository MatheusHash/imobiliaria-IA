import { XCircle } from "lucide-react";
import { CancelAlertButton } from "@/components/alerts/cancel-alert-button";
import { LinkButton } from "@/components/ui/button";
import { describeAlertFilters, getAlertByCancelToken, type AlertFilters } from "@/lib/alerts";
import { requireModule } from "@/lib/modules";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function CancelAlertPage({ searchParams }: PageProps) {
  await requireModule("alertas");
  const { token } = await searchParams;
  const alert = token ? await getAlertByCancelToken(token) : null;

  return (
    <main className="container-page flex min-h-[calc(100vh-13rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        {alert ? (
          <>
            <h1 className="text-xl font-bold text-foreground">Cancelar alerta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Alerta para <strong>{describeAlertFilters(alert.filters as AlertFilters)}</strong>, enviado para {alert.email}.
            </p>
            {alert.active ? (
              <div className="mt-6">
                <CancelAlertButton token={token!} />
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">Este alerta já estava cancelado.</p>
            )}
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-600" />
            <h1 className="mt-4 text-xl font-bold text-foreground">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esse link não é válido.</p>
          </>
        )}
        <LinkButton href="/imoveis" variant="outline" className="mt-6">
          Voltar para os imóveis
        </LinkButton>
      </div>
    </main>
  );
}
