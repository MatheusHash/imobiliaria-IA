import { CheckCircle2, XCircle } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { confirmAlert, describeAlertFilters, type AlertFilters } from "@/lib/alerts";
import { requireModule } from "@/lib/modules";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ token?: string }> };

export default async function ConfirmAlertPage({ searchParams }: PageProps) {
  await requireModule("alertas");
  const { token } = await searchParams;
  const alert = token ? await confirmAlert(token) : null;

  return (
    <main className="container-page flex min-h-[calc(100vh-13rem)] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        {alert ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h1 className="mt-4 text-xl font-bold text-foreground">Alerta confirmado!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você vai receber um e-mail quando surgir um imóvel assim: <strong>{describeAlertFilters(alert.filters as AlertFilters)}</strong>
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto h-10 w-10 text-red-600" />
            <h1 className="mt-4 text-xl font-bold text-foreground">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esse link de confirmação não é válido. Cadastre o alerta novamente.</p>
          </>
        )}
        <LinkButton href="/imoveis" variant="outline" className="mt-6">
          Voltar para os imóveis
        </LinkButton>
      </div>
    </main>
  );
}
