import { PropertyGrid } from "@/components/properties/property-grid";

export const dynamic = "force-dynamic";
import { SearchForm } from "@/components/properties/search-form";
import { getProperties, type PropertyFilters } from "@/lib/properties";

type PageProps = {
  searchParams: Promise<PropertyFilters>;
};

export default async function PropertiesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const properties = await getProperties(filters);

  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Busca</p>
        <h1 className="text-3xl font-bold text-slate-950">Imóveis disponíveis</h1>
        <p className="mt-2 text-slate-600">Use os filtros para encontrar imóveis por tipo, transação, cidade e faixa de preço.</p>
      </div>

      <div className="mb-8 rounded-xl border bg-slate-50 p-4">
        <SearchForm filters={filters} compact />
      </div>

      <div className="mb-4 text-sm text-slate-600">{properties.length} imóvel(is) encontrado(s)</div>
      <PropertyGrid properties={properties} />
    </main>
  );
}
