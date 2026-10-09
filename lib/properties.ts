import { Prisma, PropertyStatus, PropertyType, TransactionType } from "@prisma/client";
import { isPropertyStatus, LISTED_STATUSES } from "./property-status";
import { prisma } from "./prisma";

export type PropertyFilters = {
  code?: string;
  status?: string;
  type?: string;
  transactionType?: string;
  city?: string;
  neighborhood?: string;
  minPrice?: string;
  maxPrice?: string;
  /** Mínimo de quartos ("2" = 2 ou mais). */
  bedrooms?: string;
  /** Mínimo de vagas de garagem. */
  parking?: string;
  q?: string;
  sort?: string;
  page?: string;
};

export const PAGE_SIZE = 12;

export const sortOptions = {
  recent: { label: "Mais recentes", orderBy: { createdAt: "desc" } },
  "price-asc": { label: "Menor preço", orderBy: { price: "asc" } },
  "price-desc": { label: "Maior preço", orderBy: { price: "desc" } }
} satisfies Record<string, { label: string; orderBy: Prisma.PropertyOrderByWithRelationInput }>;

export type SortKey = keyof typeof sortOptions;

export function parseSort(value?: string): SortKey {
  return value && value in sortOptions ? (value as SortKey) : "recent";
}

/** Inteiro >= 0 a partir de um parâmetro da URL, ou undefined. */
function parseMin(value?: string) {
  if (!value || !/^\d{1,3}$/.test(value)) return undefined;
  return Number(value);
}

export type PropertyDTO = {
  id: string;
  code: number;
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
  status: PropertyStatus;
  condoFee: number | null;
  iptu: number | null;
  parkingSpaces: number;
  furnished: boolean;
  petFriendly: boolean;
  amenities: string[];
  viewCount: number;
  images: string[];
  latitude: number | null;
  longitude: number | null;
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
    condoFee: property.condoFee === null ? null : Number(property.condoFee),
    iptu: property.iptu === null ? null : Number(property.iptu),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString()
  };
}

/** Converte "1001" em 1001; qualquer outro formato retorna null. */
export function parsePropertyCode(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed || !/^\d{1,9}$/.test(trimmed)) return null;
  return Number(trimmed);
}

type Audience = "public" | "admin";

/**
 * Filtros de busca. No site público (`public`) só aparecem imóveis disponíveis;
 * no admin, todos, com filtro opcional por status.
 */
export function buildPropertyWhere(filters: PropertyFilters = {}, audience: Audience = "public"): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  if (audience === "public") where.status = { in: LISTED_STATUSES };
  else if (isPropertyStatus(filters.status)) where.status = filters.status;

  if (includeType(filters.type)) where.type = filters.type;
  if (includeTransactionType(filters.transactionType)) where.transactionType = filters.transactionType;
  if (filters.city) where.city = { contains: filters.city, mode: "insensitive" };
  if (filters.neighborhood) where.neighborhood = { contains: filters.neighborhood, mode: "insensitive" };

  const bedrooms = parseMin(filters.bedrooms);
  if (bedrooms) where.bedrooms = { gte: bedrooms };
  const parking = parseMin(filters.parking);
  if (parking) where.parkingSpaces = { gte: parking };
  if (filters.q) {
    const qCode = parsePropertyCode(filters.q);
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      ...(qCode !== null ? [{ code: qCode }] : [])
    ];
  }

  const code = parsePropertyCode(filters.code);
  if (code !== null) where.code = code;

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

export async function getProperties(filters: PropertyFilters = {}, audience: Audience = "public") {
  const properties = await prisma.property.findMany({
    where: buildPropertyWhere(filters, audience),
    orderBy: { createdAt: "desc" }
  });
  return properties.map((property) => toDTO(property));
}

/** Página de resultados do site público, com ordenação e total para a paginação. */
export async function getPropertiesPage(filters: PropertyFilters = {}) {
  const where = buildPropertyWhere(filters, "public");
  const total = await prisma.property.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseMin(filters.page) ?? 1), pageCount);

  const properties = await prisma.property.findMany({
    where,
    orderBy: [sortOptions[parseSort(filters.sort)].orderBy, { code: "desc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return { properties: properties.map((property) => toDTO(property)), total, page, pageCount };
}

export async function getFeaturedProperties() {
  const properties = await prisma.property.findMany({
    where: { featured: true, status: { in: LISTED_STATUSES } },
    orderBy: { createdAt: "desc" },
    take: 6
  });
  return properties.map((property) => toDTO(property));
}

export async function getPropertyById(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  return property ? toDTO(property) : null;
}

export async function getPropertyByCode(code: number) {
  const property = await prisma.property.findUnique({ where: { code } });
  return property ? toDTO(property) : null;
}

/** Busca pelo código numérico ("1001") ou, para links antigos, pelo id interno (UUID). */
export async function getPropertyByCodeOrId(value: string) {
  const code = parsePropertyCode(value);
  return code !== null ? getPropertyByCode(code) : getPropertyById(value);
}

/** Imóveis disponíveis parecidos (mesmo tipo e transação, de preferência na mesma cidade). */
export async function getSimilarProperties(property: PropertyDTO, take = 3) {
  const base = {
    id: { not: property.id },
    status: { in: LISTED_STATUSES },
    type: property.type,
    transactionType: property.transactionType
  };

  const sameCity = await prisma.property.findMany({
    where: { ...base, city: { equals: property.city, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take
  });

  const others =
    sameCity.length < take
      ? await prisma.property.findMany({
          where: { ...base, id: { notIn: [property.id, ...sameCity.map((item) => item.id)] } },
          orderBy: { createdAt: "desc" },
          take: take - sameCity.length
        })
      : [];

  return [...sameCity, ...others].map((item) => toDTO(item));
}

/** SQL direto para não alterar o updatedAt (usado no sitemap como data de modificação). */
export async function incrementPropertyViews(id: string) {
  await prisma.$executeRaw`UPDATE "Property" SET "viewCount" = "viewCount" + 1 WHERE "id" = ${id}`;
}
