import { Building2, KeyRound, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";
import { PropertyGrid } from "@/components/properties/property-grid";
import { SearchForm } from "@/components/properties/search-form";
import { LinkButton } from "@/components/ui/button";
import { getFeaturedProperties } from "@/lib/properties";

export default async function HomePage() {
  const featured = await getFeaturedProperties();

  return (
    <main>
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 py-20 text-white">
        <div className="container-page">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-slate-300">Prime Lar Imobiliária</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">Encontre o imóvel ideal para o seu próximo capítulo.</h1>
            <p className="mt-5 text-lg text-slate-300">Busque casas, apartamentos, salas comerciais e terrenos para venda ou aluguel nas melhores regiões.</p>
          </div>
          <div className="mt-10 text-slate-950">
            <SearchForm />
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Building2, title: "Curadoria de imóveis", text: "Catálogo organizado com opções qualificadas." },
            { icon: KeyRound, title: "Compra e locação", text: "Atendimento para venda e aluguel." },
            { icon: ShieldCheck, title: "Negociação segura", text: "Equipe preparada para apoiar cada etapa." }
          ].map((item) => (
            <div key={item.title} className="rounded-xl border bg-white p-5 shadow-sm">
              <item.icon className="h-8 w-8 text-slate-900" />
              <h2 className="mt-3 font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Destaques</p>
            <h2 className="text-3xl font-bold text-slate-950">Imóveis em destaque</h2>
          </div>
          <LinkButton href="/imoveis" variant="outline">Ver todos</LinkButton>
        </div>
        <PropertyGrid properties={featured} />
      </section>
    </main>
  );
}
