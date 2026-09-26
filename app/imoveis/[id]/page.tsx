export const dynamic = "force-dynamic";
import { notFound, permanentRedirect } from "next/navigation";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InterestForm } from "@/components/leads/interest-form";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { getPropertyByCodeOrId, parsePropertyCode } from "@/lib/properties";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyByCodeOrId(id);

  if (!property) notFound();
  // Links antigos usavam o UUID; o endereço público oficial é o código.
  if (parsePropertyCode(id) === null) permanentRedirect(`/imoveis/${property.code}`);

  return (
    <main className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge>{propertyTypeLabel(property.type)}</Badge>
        <Badge className="bg-primary text-primary-foreground">{transactionTypeLabel(property.transactionType)}</Badge>
        {property.featured && <Badge className="bg-primary text-primary-foreground">Destaque</Badge>}
        <span className="ml-auto text-sm font-medium text-muted-foreground">Código do imóvel: <strong className="text-foreground">{property.code}</strong></span>
      </div>

      <section>
        <PropertyGallery images={property.images} title={property.title} />
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(property.price, property.transactionType)}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">{property.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" /> {property.address}, {property.neighborhood} - {property.city}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><BedDouble className="mb-2 h-5 w-5" />{property.bedrooms} quartos</div>
            <div className="rounded-xl border p-4"><Bath className="mb-2 h-5 w-5" />{property.bathrooms} banheiros</div>
            <div className="rounded-xl border p-4"><Ruler className="mb-2 h-5 w-5" />{property.area} m²</div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Descrição</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-muted-foreground">{property.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Localização</h2>
            <div className="mt-3 rounded-xl border bg-background p-6 text-muted-foreground">
              {property.address}, {property.neighborhood}, {property.city}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border bg-background p-6 shadow-sm">
          <h2 className="text-xl font-bold">Tenho interesse</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados e nossa equipe entrará em contato.</p>
          <InterestForm propertyId={property.id} defaultMessage={`Tenho interesse no imóvel ${property.code}: ${property.title}`} />
        </aside>
      </section>
    </main>
  );
}