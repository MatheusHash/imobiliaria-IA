import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input, Label, Select } from "@/components/ui/field";
import type { PropertyFilters } from "@/lib/properties";

const minOptions = (max: number, unit: string) => [
  { value: "", label: "Qualquer" },
  ...Array.from({ length: max }, (_, index) => ({ value: String(index + 1), label: `${index + 1}+ ${unit}` }))
];

export function SearchForm({ filters = {}, compact = false }: { filters?: PropertyFilters; compact?: boolean }) {
  const hasMoreFilters = Boolean(filters.bedrooms || filters.parking || filters.neighborhood);

  return (
    <form action="/imoveis" className={compact ? "grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7" : "grid gap-4 rounded-2xl border bg-background p-4 shadow-xl sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"}>
      {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
      <div>
        <Label htmlFor="code">Código</Label>
        <Input id="code" name="code" inputMode="numeric" pattern="[0-9]*" placeholder="Ex.: 1001" defaultValue={filters.code ?? ""} />
      </div>
      <div>
        <Label htmlFor="type">Tipo</Label>
        <Select id="type" name="type" defaultValue={filters.type ?? ""}>
          <option value="">Todos</option>
          <option value="APARTMENT">Apartamento</option>
          <option value="HOUSE">Casa</option>
          <option value="COMMERCIAL">Comercial</option>
          <option value="LAND">Terreno</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="transactionType">Transação</Label>
        <Select id="transactionType" name="transactionType" defaultValue={filters.transactionType ?? ""}>
          <option value="">Todas</option>
          <option value="SALE">Venda</option>
          <option value="RENT">Aluguel</option>
        </Select>
      </div>
      <div>
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" name="city" placeholder="Ex.: São Paulo" defaultValue={filters.city ?? ""} />
      </div>
      <div>
        <Label htmlFor="minPrice">Preço mín.</Label>
        <CurrencyInput id="minPrice" name="minPrice" defaultValue={filters.minPrice} />
      </div>
      <div>
        <Label htmlFor="maxPrice">Preço máx.</Label>
        <CurrencyInput id="maxPrice" name="maxPrice" defaultValue={filters.maxPrice} />
      </div>
      <div className="flex items-end sm:col-span-2 lg:col-span-1">
        <Button type="submit" className="w-full">Buscar</Button>
      </div>
      <details className="group col-span-full" open={hasMoreFilters}>
        <summary className="cursor-pointer select-none text-sm font-medium text-primary">Mais filtros</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="bedrooms">Quartos</Label>
            <Select id="bedrooms" name="bedrooms" defaultValue={filters.bedrooms ?? ""}>
              {minOptions(4, "quartos").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="parking">Vagas de garagem</Label>
            <Select id="parking" name="parking" defaultValue={filters.parking ?? ""}>
              {minOptions(3, "vagas").map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" name="neighborhood" placeholder="Ex.: Centro" defaultValue={filters.neighborhood ?? ""} />
          </div>
        </div>
      </details>
    </form>
  );
}
