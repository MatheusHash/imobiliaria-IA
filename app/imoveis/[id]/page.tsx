export const dynamic = "force-dynamic";
import { notFound, permanentRedirect } from "next/navigation";
import { Bath, BedDouble, Car, Check, Info, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InterestForm } from "@/components/leads/interest-form";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyGrid } from "@/components/properties/property-grid";
import { amenityLabels, isAmenity } from "@/lib/amenities";
import { getCurrentUser } from "@/lib/auth";
import { getPropertyByCodeOrId, getSimilarProperties, parsePropertyCode } from "@/lib/properties";
import { ACCEPTS_LEADS_STATUSES, PUBLIC_PAGE_STATUSES, propertyStatusLabels } from "@/lib/property-status";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

const statusNotices = {
  RESERVED: "Este imóvel está reservado. Deixe seu contato para ser avisado caso a negociação não se concretize.",
  SOLD: "Este imóvel já foi vendido.",
  RENTED: "Este imóvel já foi alugado.",
  DRAFT: "Pré-visualização: este imóvel é um rascunho e não aparece para os clientes.",
  INACTIVE: "Pré-visualização: este imóvel está inativo e não aparece para os clientes."
} as const;

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyByCodeOrId(id);

  if (!property) notFound();
  // Rascunhos e inativos só podem ser vistos pela equipe (pré-visualização).
  if (!PUBLIC_PAGE_STATUSES.includes(property.status) && !(await getCurrentUser())) notFound();
  // Links antigos usavam o UUID; o endereço público oficial é o código.
  if (parsePropertyCode(id) === null) permanentRedirect(`/imoveis/${property.code}`);

  const acceptsLeads = ACCEPTS_LEADS_STATUSES.includes(property.status);
  const notice = property.status === "AVAILABLE" ? null : statusNotices[property.status];
  const similar = await getSimilarProperties(property);
  const amenities = property.amenities.filter(isAmenity);
  const monthlyCosts = [
    property.condoFee !== null && { label: "Condomínio", value: `${formatCurrency(property.condoFee)}/mês` },
    property.iptu !== null && { label: "IPTU", value: `${formatCurrency(property.iptu)}/ano` }
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge>{propertyTypeLabel(property.type)}</Badge>
        <Badge className="bg-primary text-primary-foreground">{transactionTypeLabel(property.transactionType)}</Badge>
        {property.featured && property.status === "AVAILABLE" && <Badge className="bg-primary text-primary-foreground">Destaque</Badge>}
        {property.status !== "AVAILABLE" && <Badge className="bg-amber-500 text-black">{propertyStatusLabels[property.status]}</Badge>}
        <span className="ml-auto text-sm font-medium text-muted-foreground">Código do imóvel: <strong className="text-foreground">{property.code}</strong></span>
      </div>

      {notice && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500 bg-secondary p-4 text-sm text-foreground">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <span>
            {notice}
            {(property.status === "SOLD" || property.status === "RENTED") && similar.length > 0 && " Veja abaixo outras opções semelhantes."}
          </span>
        </div>
      )}

      <section>
        <PropertyGallery images={property.images} title={property.title} />
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-3xl font-bold text-foreground">{formatCurrency(property.price, property.transactionType)}</p>
          {monthlyCosts.length > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">{monthlyCosts.map((cost) => `${cost.label}: ${cost.value}`).join(" · ")}</p>
          )}
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground">{property.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" /> {property.address}, {property.neighborhood} - {property.city}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border p-4"><BedDouble className="mb-2 h-5 w-5" />{property.bedrooms} quartos</div>
            <div className="rounded-xl border p-4"><Bath className="mb-2 h-5 w-5" />{property.bathrooms} banheiros</div>
            <div className="rounded-xl border p-4"><Car className="mb-2 h-5 w-5" />{property.parkingSpaces} {property.parkingSpaces === 1 ? "vaga" : "vagas"}</div>
            <div className="rounded-xl border p-4"><Ruler className="mb-2 h-5 w-5" />{property.area} m²</div>
          </div>

          {(property.furnished || property.petFriendly || amenities.length > 0) && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold">Características</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-foreground sm:grid-cols-3">
                {property.furnished && <Feature label="Mobiliado" />}
                {property.petFriendly && <Feature label="Aceita pet" />}
                {amenities.map((amenity) => (
                  <Feature key={amenity} label={amenityLabels[amenity]} />
                ))}
              </ul>
            </div>
          )}

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
          {acceptsLeads ? (
            <>
              <h2 className="text-xl font-bold">Tenho interesse</h2>
              <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados e nossa equipe entrará em contato.</p>
              <InterestForm propertyId={property.id} defaultMessage={`Tenho interesse no imóvel ${property.code}: ${property.title}`} />
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">Imóvel indisponível</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {property.status === "SOLD" || property.status === "RENTED"
                  ? similar.length > 0
                    ? "Este imóvel já foi negociado. Confira as opções semelhantes abaixo ou faça uma nova busca."
                    : "Este imóvel já foi negociado. Faça uma nova busca para encontrar outras opções."
                  : "Este imóvel não está recebendo contatos no momento."}
              </p>
            </>
          )}
        </aside>
      </section>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Imóveis semelhantes</h2>
          <PropertyGrid properties={similar} />
        </section>
      )}
    </main>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-primary" />
      {label}
    </li>
  );
}
