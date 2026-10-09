import { FinancingSettingsForm } from "@/components/financing/financing-settings-form";
import { requireAdmin } from "@/lib/auth";
import { getFinancingSettings } from "@/lib/financing-settings";
import { requireModule } from "@/lib/modules";

export const dynamic = "force-dynamic";

export default async function AdminFinanciamentoPage() {
  await requireAdmin("/admin/financiamento");
  await requireModule("financiamento");

  const settings = await getFinancingSettings();

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Simulador de financiamento</h1>
        <p className="mt-2 text-muted-foreground">
          Taxa e entrada sugeridas, usadas como padrão na simulação mostrada na página de cada imóvel à venda.
        </p>
      </div>
      <FinancingSettingsForm settings={settings} />
    </main>
  );
}
