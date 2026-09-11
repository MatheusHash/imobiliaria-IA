import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Administração</p>
        <h1 className="text-3xl font-bold text-slate-950">Novo imóvel</h1>
        <p className="mt-2 text-slate-600">Preencha todos os dados para cadastrar um imóvel.</p>
      </div>
      <PropertyForm />
    </main>
  );
}
