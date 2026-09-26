"use client";

import { useActionState, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import type { PropertyDTO } from "@/lib/properties";
import { createPropertyAction, updatePropertyAction, type ActionState } from "@/lib/actions";
import { propertyFormSchema, type PropertyFormInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";

const initialState: ActionState = {};

export function PropertyForm({ property }: { property?: PropertyDTO }) {
  const action = property ? updatePropertyAction.bind(null, property.id) : createPropertyAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>(property?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PropertyFormInput>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      title: property?.title ?? "",
      description: property?.description ?? "",
      price: property?.price ?? 0,
      type: property?.type ?? "APARTMENT",
      transactionType: property?.transactionType ?? "SALE",
      bedrooms: property?.bedrooms ?? 0,
      bathrooms: property?.bathrooms ?? 0,
      area: property?.area ?? 1,
      city: property?.city ?? "",
      neighborhood: property?.neighborhood ?? "",
      address: property?.address ?? "",
      featured: property?.featured ?? false,
      imagesText: property?.images.join("\n") ?? ""
    }
  });

  const serverError = (field: string) => state.errors?.[field]?.[0];

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      if (property?.id) formData.append("propertyId", property.id);

      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message ?? "Erro ao fazer upload");
        return;
      }

      setUploadedPaths((prev) => [...prev, ...data.paths]);
    } catch {
      alert("Erro ao fazer upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeUploaded(index: number) {
    setUploadedPaths((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={formAction} className="space-y-6 rounded-xl border bg-background p-6 shadow-sm">
      <input
        type="hidden"
        name="imagesText"
        value={uploadedPaths.join("\n")}
      />

      {state.message && (
        <div
          className={
            state.success
              ? "rounded-md bg-emerald-50 p-3 text-sm text-emerald-700"
              : "rounded-md bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {state.message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...form.register("title")} />
          <FieldError message={form.formState.errors.title?.message ?? serverError("title")} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...form.register("description")} />
          <FieldError message={form.formState.errors.description?.message ?? serverError("description")} />
        </div>
        <div>
          <Label htmlFor="price">Preço</Label>
          <CurrencyInput id="price" name="price" defaultValue={property?.price} />
          <FieldError message={form.formState.errors.price?.message ?? serverError("price")} />
        </div>
        <div>
          <Label htmlFor="area">Área (m²)</Label>
          <Input id="area" type="number" step="0.01" {...form.register("area")} />
          <FieldError message={form.formState.errors.area?.message ?? serverError("area")} />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select id="type" {...form.register("type")}>
            <option value="APARTMENT">Apartamento</option>
            <option value="HOUSE">Casa</option>
            <option value="COMMERCIAL">Comercial</option>
            <option value="LAND">Terreno</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="transactionType">Transação</Label>
          <Select id="transactionType" {...form.register("transactionType")}>
            <option value="SALE">Venda</option>
            <option value="RENT">Aluguel</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="bedrooms">Quartos</Label>
          <Input id="bedrooms" type="number" min="0" {...form.register("bedrooms")} />
        </div>
        <div>
          <Label htmlFor="bathrooms">Banheiros</Label>
          <Input id="bathrooms" type="number" min="0" {...form.register("bathrooms")} />
        </div>
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" {...form.register("city")} />
          <FieldError message={form.formState.errors.city?.message ?? serverError("city")} />
        </div>
        <div>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input id="neighborhood" {...form.register("neighborhood")} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" {...form.register("address")} />
        </div>

        {/* Upload de imagens */}
        <div className="md:col-span-2">
          <Label>Imagens do imóvel</Label>
          <div className="mt-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background px-4 py-8 text-sm text-muted-foreground hover:border-primary hover:bg-secondary">
              <Upload className="h-5 w-5" />
              {uploading ? "Enviando..." : "Clique para selecionar imagens"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {uploadedPaths.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {uploadedPaths.map((path, index) => (
                <div key={`${path}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border bg-secondary">
                  <Image src={path} alt={`Imagem ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                  <button
                    type="button"
                    onClick={() => removeUploaded(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input type="checkbox" className="h-4 w-4 rounded border-border" {...form.register("featured")} />
          Imóvel em destaque
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending || uploading}>
          {pending ? "Salvando..." : "Salvar imóvel"}
        </Button>
      </div>
    </form>
  );
}