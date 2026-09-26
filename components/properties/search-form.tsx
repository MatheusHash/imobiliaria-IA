import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input, Label, Select } from "@/components/ui/field";
import type { PropertyFilters } from "@/lib/properties";

export function SearchForm({ filters = {}, compact = false }: { filters?: PropertyFilters; compact?: boolean }) {
  return (
    <form action="/imoveis" className={compact ? "grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7" : "grid gap-4 rounded-2xl border bg-background p-4 shadow-xl sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7"}>
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
    </form>
  );
}
