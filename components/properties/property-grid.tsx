import type { PropertyDTO } from "@/lib/properties";
import { PropertyCard } from "./property-card";

export function PropertyGrid({ properties }: { properties: PropertyDTO[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Nenhum imóvel encontrado com os filtros selecionados.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
