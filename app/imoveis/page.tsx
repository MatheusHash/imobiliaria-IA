import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PropertyGrid } from "@/components/properties/property-grid";
import { SearchForm } from "@/components/properties/search-form";
import { getPropertiesPage, parseSort, sortOptions, type PropertyFilters, type SortKey } from "@/lib/properties";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imóveis à venda e para alugar",
  description: "Busque casas, apartamentos, salas comerciais e terrenos por cidade, bairro, preço, quartos e vagas."
};

type PageProps = {
  searchParams: Promise<PropertyFilters>;
};

/** Monta a URL da listagem mantendo os filtros atuais e omitindo os vazios. */
function listingHref(filters: PropertyFilters, overrides: Partial<PropertyFilters>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/imoveis?${query}` : "/imoveis";
}

/** Números de página a exibir: primeira, última e vizinhas da atual; null = reticências. */
function pageNumbers(page: number, pageCount: number) {
  const numbers: (number | null)[] = [];
  for (let number = 1; number <= pageCount; number++) {
    if (number === 1 || number === pageCount || Math.abs(number - page) <= 2) numbers.push(number);
    else if (numbers[numbers.length - 1] !== null) numbers.push(null);
  }
  return numbers;
}

export default async function PropertiesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const { properties, total, page, pageCount } = await getPropertiesPage(filters);
  const sort = parseSort(filters.sort);

  // Quem busca pelo código quer ver aquele imóvel: vai direto para a página dele.
  if (filters.code && total === 1) redirect(`/imoveis/${properties[0].code}`);

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

      <div className="mb-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">
          {total === 1 ? "1 imóvel encontrado" : `${total} imóveis encontrados`}
          {pageCount > 1 && ` · página ${page} de ${pageCount}`}
        </p>
        <nav aria-label="Ordenar resultados" className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-muted-foreground">Ordenar:</span>
          {(Object.keys(sortOptions) as SortKey[]).map((key) => (
            <Link
              key={key}
              href={listingHref(filters, { sort: key === "recent" ? undefined : key, page: undefined })}
              aria-current={sort === key ? "true" : undefined}
              className={cn(
                "rounded-full px-3 py-1 font-medium",
                sort === key ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"
              )}
            >
              {sortOptions[key].label}
            </Link>
          ))}
        </nav>
      </div>

      <PropertyGrid properties={properties} />

      {pageCount > 1 && (
        <nav aria-label="Paginação" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link className="rounded-md border px-3 py-2 hover:bg-secondary" href={listingHref(filters, { page: String(page - 1) })}>
              Anterior
            </Link>
          )}
          {pageNumbers(page, pageCount).map((number, index) =>
            number === null ? (
              <span key={`gap-${index}`} className="px-1 text-muted-foreground">…</span>
            ) : (
              <Link
                key={number}
                href={listingHref(filters, { page: number === 1 ? undefined : String(number) })}
                aria-current={number === page ? "page" : undefined}
                className={cn(
                  "min-w-10 rounded-md border px-3 py-2 text-center",
                  number === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-secondary"
                )}
              >
                {number}
              </Link>
            )
          )}
          {page < pageCount && (
            <Link className="rounded-md border px-3 py-2 hover:bg-secondary" href={listingHref(filters, { page: String(page + 1) })}>
              Próxima
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
