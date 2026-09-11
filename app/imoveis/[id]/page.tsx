export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { PropertyGallery } from "@/components/properties/property-gallery";
import { getPropertyById } from "@/lib/properties";
import { formatCurrency, propertyTypeLabel, transactionTypeLabel } from "@/lib/utils";

type PageProps = { params: Promise<{ id: string }> };

export default async function PropertyDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  return (
    <main className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge>{propertyTypeLabel(property.type)}</Badge>
        <Badge className="bg-slate-950 text-white">{transactionTypeLabel(property.transactionType)}</Badge>
        {property.featured && <Badge className="bg-amber-100 text-amber-800">Destaque</Badge>}
      </div>

      <section>
        <PropertyGallery images={property.images} title={property.title} />
      </section>

      <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <p className="text-3xl font-bold text-slate-950">{formatCurrency(property.price, property.transactionType)}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">{property.title}</h1>
          <p className="mt-3 flex items-center gap-2 text-slate-600">
            <MapPin className="h-5 w-5" /> {property.address}, {property.neighborhood} - {property.city}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border p-4"><BedDouble className="mb-2 h-5 w-5" />{property.bedrooms} quartos</div>
            <div className="rounded-xl border p-4"><Bath className="mb-2 h-5 w-5" />{property.bathrooms} banheiros</div>
            <div className="rounded-xl border p-4"><Ruler className="mb-2 h-5 w-5" />{property.area} m²</div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Descrição</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">{property.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold">Localização</h2>
            <div className="mt-3 rounded-xl border bg-slate-50 p-6 text-slate-700">
              {property.address}, {property.neighborhood}, {property.city}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Tenho interesse</h2>
          <p className="mt-1 text-sm text-slate-600">Preencha seus dados e nossa equipe entrará em contato.</p>
          <form className="mt-5 space-y-4">
            <div><Label htmlFor="name">Nome</Label><Input id="name" name="name" required /></div>
            <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
            <div><Label htmlFor="phone">Telefone</Label><Input id="phone" name="phone" required /></div>
            <div><Label htmlFor="message">Mensagem</Label><Textarea id="message" name="message" defaultValue={`Tenho interesse no imóvel: ${property.title}`} /></div>
            <Button type="submit" className="w-full">Enviar interesse</Button>
          </form>
        </aside>
      </section>
    </main>
  );
}