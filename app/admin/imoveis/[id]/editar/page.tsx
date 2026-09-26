import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
import { PropertyForm } from "@/components/properties/property-form";
import { getPropertyById } from "@/lib/properties";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Editar imóvel</h1>
        <p className="mt-2 text-muted-foreground">Atualize as informações do imóvel <strong className="text-foreground">código {property.code}</strong>.</p>
      </div>
      <PropertyForm property={property} />
    </main>
  );
}
