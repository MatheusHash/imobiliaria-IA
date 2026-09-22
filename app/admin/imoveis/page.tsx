import Link from "next/link";

export const dynamic = "force-dynamic";
import { Eye, Pencil } from "lucide-react";
import { DeletePropertyButton } from "@/components/properties/delete-property-button";
import { LinkButton } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { getProperties, type PropertyFilters } from "@/lib/properties";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

type PageProps = { searchParams: Promise<PropertyFilters> };

export default async function AdminPropertiesPage({ searchParams }: PageProps) {
  const filters = await searchParams;
  const properties = await getProperties(filters);

  return (
    <main className="container-page py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
          <h1 className="text-3xl font-bold text-foreground">Imóveis cadastrados</h1>
        </div>
        <LinkButton href="/admin/imoveis/novo">Novo Imóvel</LinkButton>
      </div>

      <form className="mb-6 grid gap-3 rounded-xl border bg-background p-4 md:grid-cols-5">
        <div className="md:col-span-2"><Label htmlFor="q">Buscar por título</Label><Input id="q" name="q" defaultValue={filters.q ?? ""} placeholder="Título do imóvel" /></div>
        <div><Label htmlFor="type">Tipo</Label><Select id="type" name="type" defaultValue={filters.type ?? ""}><option value="">Todos</option><option value="APARTMENT">Apartamento</option><option value="HOUSE">Casa</option><option value="COMMERCIAL">Comercial</option><option value="LAND">Terreno</option></Select></div>
        <div><Label htmlFor="transactionType">Transação</Label><Select id="transactionType" name="transactionType" defaultValue={filters.transactionType ?? ""}><option value="">Todas</option><option value="SALE">Venda</option><option value="RENT">Aluguel</option></Select></div>
        <button className="mt-6 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground" type="submit">Filtrar</button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-background text-left text-xs font-semibold uppercase tracking-wide text-primary">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Transação</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Destaque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-secondary">
                  <td className="px-4 py-3 font-medium text-foreground">{property.title}</td>
                  <td className="px-4 py-3">{propertyTypeLabel(property.type)}</td>
                  <td className="px-4 py-3">{transactionTypeLabel(property.transactionType)}</td>
                  <td className="px-4 py-3">{property.city}</td>
                  <td className="px-4 py-3">{formatCurrency(property.price, property.transactionType)}</td>
                  <td className="px-4 py-3">{property.featured ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link className="inline-flex h-8 items-center rounded-md border px-3 hover:bg-secondary" href={`/imoveis/${property.id}`}><Eye className="mr-1 h-4 w-4" />Ver</Link>
                      <Link className="inline-flex h-8 items-center rounded-md border px-3 hover:bg-secondary" href={`/admin/imoveis/${property.id}/editar`}><Pencil className="mr-1 h-4 w-4" />Editar</Link>
                      <DeletePropertyButton id={property.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {properties.length === 0 && (
                <tr><td className="px-4 py-8 text-center text-primary" colSpan={7}>Nenhum imóvel cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
