import { Prisma, PropertyType, TransactionType } from "@prisma/client";
import { prisma } from "./prisma";

export type PropertyFilters = {
  type?: string;
  transactionType?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string;
};

export type PropertyDTO = {
  id: string;
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  transactionType: TransactionType;
  bedrooms: number;
  bathrooms: number;
  area: number;
  city: string;
  neighborhood: string;
  address: string;
  featured: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

const includeType = (value?: string): value is PropertyType =>
  !!value && Object.values(PropertyType).includes(value as PropertyType);

const includeTransactionType = (value?: string): value is TransactionType =>
  !!value && Object.values(TransactionType).includes(value as TransactionType);

function toDTO(property: Awaited<ReturnType<typeof prisma.property.findFirst>>): PropertyDTO {
  if (!property) throw new Error("Property not found");

  return {
    ...property,
    price: Number(property.price),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString()
  };
}

export function buildPropertyWhere(filters: PropertyFilters = {}): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (includeType(filters.type)) where.type = filters.type;
  if (includeTransactionType(filters.transactionType)) where.transactionType = filters.transactionType;
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.q) where.title = { contains: filters.q, mode: "insensitive" };

  const min = filters.minPrice ? Number(filters.minPrice) : undefined;
  const max = filters.maxPrice ? Number(filters.maxPrice) : undefined;
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    where.price = {
      ...(min !== undefined && !Number.isNaN(min) ? { gte: min } : {}),
      ...(max !== undefined && !Number.isNaN(max) ? { lte: max } : {})
    };
  }

  return where;
}

export async function getProperties(filters: PropertyFilters = {}) {
  const properties = await prisma.property.findMany({
    where: buildPropertyWhere(filters),
    orderBy: { createdAt: "desc" }
  });
  return properties.map((property) => toDTO(property));
}

export async function getFeaturedProperties() {
  const properties = await prisma.property.findMany({
    where: { featured: true },
    orderBy: { createdAt: "desc" },
    take: 6
  });
  return properties.map((property) => toDTO(property));
}

export async function getPropertyById(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  return property ? toDTO(property) : null;
}
