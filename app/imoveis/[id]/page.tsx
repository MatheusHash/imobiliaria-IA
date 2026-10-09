export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Bath, BedDouble, Car, Check, Info, MapPin, MessageCircle, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InterestForm } from "@/components/leads/interest-form";
import { FinancingSimulator } from "@/components/properties/financing-simulator";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { PropertyGrid } from "@/components/properties/property-grid";
import { PropertyMap } from "@/components/properties/property-map";
import { amenityLabels, isAmenity } from "@/lib/amenities";
import { getCurrentUser } from "@/lib/auth";
import { getFinancingSettings } from "@/lib/financing-settings";
import { whatsappLink } from "@/lib/leads";
import { isModuleEnabled } from "@/lib/modules";
import { getPropertyByCodeOrId, getSimilarProperties, incrementPropertyViews, parsePropertyCode } from "@/lib/properties";
import { ACCEPTS_LEADS_STATUSES, PUBLIC_PAGE_STATUSES, propertyStatusLabels } from "@/lib/property-status";
import { siteConfig } from "@/lib/site";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

// Título, descrição e foto usados no preview do link (WhatsApp, Facebook, Google).
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyByCodeOrId(id);
  if (!property || !PUBLIC_PAGE_STATUSES.includes(property.status)) return { title: "Imóvel não encontrado" };

  const title = `${property.title} — ${formatCurrency(property.price, property.transactionType)}`;
  const details = [
    `${propertyTypeLabel(property.type)} para ${property.transactionType === "RENT" ? "alugar" : "comprar"}`,
    `${property.neighborhood}, ${property.city}`,
    property.bedrooms > 0 && `${property.bedrooms} quarto${property.bedrooms > 1 ? "s" : ""}`,
    `${property.area} m²`,
    `Código ${property.code}`
  ].filter(Boolean);
  const description = details.join(" · ");
  const url = `/imoveis/${property.code}`;
  const image = property.images[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: image ? [{ url: image, alt: property.title }] : undefined },
    twitter: { card: image ? "summary_large_image" : "summary", title, description }
  };
}

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
  const viewer = await getCurrentUser();
  // Rascunhos e inativos só podem ser vistos pela equipe (pré-visualização).
  if (!PUBLIC_PAGE_STATUSES.includes(property.status) && !viewer) notFound();
  // Links antigos usavam o UUID; o endereço público oficial é o código.
  if (parsePropertyCode(id) === null) permanentRedirect(`/imoveis/${property.code}`);

  // Conta só visitas de clientes, não da equipe.
  if (!viewer) await incrementPropertyViews(property.id);

  const acceptsLeads = ACCEPTS_LEADS_STATUSES.includes(property.status);
  const notice = property.status === "AVAILABLE" ? null : statusNotices[property.status];
  const similar = await getSimilarProperties(property);
  const showFinancingSimulator = acceptsLeads && property.transactionType === "SALE" && (await isModuleEnabled("financiamento"));
  const financingSettings = showFinancingSimulator ? await getFinancingSettings() : null;
  const showMap = property.latitude !== null && property.longitude !== null && (await isModuleEnabled("mapa"));
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
            {showMap && property.latitude !== null && property.longitude !== null && (
              <div className="mt-3">
                <PropertyMap latitude={property.latitude} longitude={property.longitude} label={`${property.neighborhood}, ${property.city}`} />
              </div>
            )}
          </div>

          {showFinancingSimulator && financingSettings && (
            <FinancingSimulator
              price={property.price}
              defaultRateYearly={financingSettings.defaultRateYearly}
              minDownPaymentPct={financingSettings.minDownPaymentPct}
              maxMonths={financingSettings.maxMonths}
            />
          )}
        </div>

        <aside className="h-fit rounded-2xl border bg-background p-6 shadow-sm">
          {acceptsLeads ? (
            <>
              <h2 className="text-xl font-bold">Tenho interesse</h2>
              {siteConfig.whatsappNumber && (
                <>
                  <a
                    href={whatsappLink(
                      siteConfig.whatsappNumber,
                      `Olá! Tenho interesse no imóvel ${property.code} (${property.title}): ${siteConfig.url}/imoveis/${property.code}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
                  </a>
                  <p className="mt-4 text-center text-xs uppercase tracking-wide text-muted-foreground">ou deixe seus dados</p>
                </>
              )}
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
