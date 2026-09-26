import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input, Label, Select } from "@/components/ui/field";
import type { PropertyFilters } from "@/lib/properties";

export function SearchForm({ filters = {}, compact = false }: { filters?: PropertyFilters; compact?: boolean }) {
  return (
    <form action="/imoveis" className={compact ? "grid gap-3 md:grid-cols-6" : "grid gap-4 rounded-2xl border bg-background p-4 shadow-xl md:grid-cols-5"}>
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
        <CurrencyInput id="minPrice" name="minPrice" defaultValue={filters.minPrice} fractionDigits={0} />
      </div>
      <div>
        <Label htmlFor="maxPrice">Preço máx.</Label>
        <div className="flex gap-2">
          <CurrencyInput id="maxPrice" name="maxPrice" defaultValue={filters.maxPrice} fractionDigits={0} />
          <Button type="submit">Buscar</Button>
        </div>
      </div>
    </form>
  );
}
