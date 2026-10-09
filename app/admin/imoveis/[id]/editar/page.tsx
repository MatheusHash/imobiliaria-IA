import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { PortalListingsForm } from "@/components/properties/portal-listings-form";
import { PropertyForm } from "@/components/properties/property-form";
import { isModuleEnabled } from "@/lib/modules";
import { getPropertyById } from "@/lib/properties";

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; duplicated?: string }> };

export default async function EditPropertyPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { created, duplicated } = await searchParams;
  const [property, mapaEnabled, portaisEnabled] = await Promise.all([
    getPropertyById(id),
    isModuleEnabled("mapa"),
    isModuleEnabled("portais")
  ]);

  if (!property) notFound();

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Editar imóvel</h1>
        <p className="mt-2 text-muted-foreground">Atualize as informações do imóvel <strong className="text-foreground">código {property.code}</strong>.</p>
      </div>
      {duplicated && (
        <div className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          Cópia criada como <strong>rascunho</strong>. Ajuste os dados e mude o status para &quot;Disponível&quot; quando quiser publicar.
        </div>
      )}
      {created && <div className="mb-6 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Imóvel cadastrado com sucesso.</div>}
      <PropertyForm property={property} mapaEnabled={mapaEnabled} />
      {portaisEnabled && <PortalListingsForm propertyId={property.id} />}
    </main>
  );
}
