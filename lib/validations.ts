import { PropertyStatus } from "@prisma/client";
import { z } from "zod";
import { amenityKeys } from "./amenities";


export const propertyTypeEnum = z.enum(["APARTMENT", "HOUSE", "COMMERCIAL", "LAND"]);
export const transactionTypeEnum = z.enum(["SALE", "RENT"]);
export const propertyStatusEnum = z.nativeEnum(PropertyStatus);

// Valor monetário opcional: vazio vira null.
const optionalMoney = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : value),
  z.coerce.number().nonnegative("Valor inválido").nullable()
);

export const imageUrlSchema = z.string().refine(
  (val) => {
    // Aceita URLs externas ou paths locais começando com /uploads/
    if (val.startsWith("/uploads/")) return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "URL inválida ou path local inválido." }
);

export const propertySchema = z.object({
  title: z.string().min(3, "Informe pelo menos 3 caracteres"),
  description: z.string().min(10, "Descreva melhor o imóvel"),
  price: z.coerce.number().positive("Preço deve ser positivo"),
  type: propertyTypeEnum,
  transactionType: transactionTypeEnum,
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  area: z.coerce.number().positive("Área deve ser positiva"),
  city: z.string().min(2, "Cidade obrigatória"),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  address: z.string().min(5, "Endereço obrigatório"),
  featured: z.coerce.boolean().default(false),
  status: propertyStatusEnum.default("AVAILABLE"),
  condoFee: optionalMoney.default(null),
  iptu: optionalMoney.default(null),
  parkingSpaces: z.coerce.number().int().min(0, "Valor inválido").default(0),
  furnished: z.coerce.boolean().default(false),
  petFriendly: z.coerce.boolean().default(false),
  amenities: z.array(z.enum(amenityKeys as [string, ...string[]])).default([]),
  images: z.array(imageUrlSchema).min(1, "Informe ao menos uma imagem")
});

export const propertyFormSchema = propertySchema.extend({
  imagesText: z.string().optional()
}).omit({ images: true });

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyFormInput = z.infer<typeof propertyFormSchema>;

export function parseImagesText(imagesText: string) {
  return imagesText
    .split(/\n|,/)
    .map((image) => image.trim())
    .filter(Boolean);
}