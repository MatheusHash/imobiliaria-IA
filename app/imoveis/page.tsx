import { PropertyGrid } from "@/components/properties/property-grid";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { SearchForm } from "@/components/properties/search-form";
import { getProperties, type PropertyFilters } from "@/lib/properties";

type PageProps = {
  searchParams: Promise<PropertyFilters>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const properties = await getProperties(filters);

  // Quem busca pelo código quer ver aquele imóvel: vai direto para a página dele.
  if (filters.code && properties.length === 1) redirect(`/imoveis/${properties[0].code}`);

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Busca</p>
        <h1 className="text-3xl font-bold text-foreground">Imóveis disponíveis</h1>
        <p className="mt-2 text-muted-foreground">Use os filtros para encontrar imóveis por código, tipo, transação, cidade e faixa de preço.</p>
      </div>

      <div className="mb-8 rounded-xl border bg-background p-4">
        <SearchForm filters={filters} compact />
      </div>

      <div className="mb-4 text-sm text-muted-foreground">{properties.length} imóvel(is) encontrado(s)</div>
      <PropertyGrid properties={properties} />
    </main>
  );
}
