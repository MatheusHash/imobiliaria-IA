import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  return (
    <main className="container-page py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Administração</p>
        <h1 className="text-3xl font-bold text-foreground">Novo imóvel</h1>
        <p className="mt-2 text-muted-foreground">Preencha todos os dados para cadastrar um imóvel.</p>
      </div>
      <PropertyForm />
    </main>
  );
}
