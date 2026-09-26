import type { PropertyStatus } from "@prisma/client";

export const propertyStatusLabels: Record<PropertyStatus, string> = {
  DRAFT: "Rascunho",
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  RENTED: "Alugado",
  INACTIVE: "Inativo"
};

export const propertyStatuses = Object.keys(propertyStatusLabels) as PropertyStatus[];

/** Aparecem na listagem e na busca do site. */
export const LISTED_STATUSES: PropertyStatus[] = ["AVAILABLE"];

/** Página pública acessível pelo link (vendidos/alugados mostram aviso). Rascunho e inativo não. */
export const PUBLIC_PAGE_STATUSES: PropertyStatus[] = ["AVAILABLE", "RESERVED", "SOLD", "RENTED"];

/** Ainda aceitam contato de interessados. */
export const ACCEPTS_LEADS_STATUSES: PropertyStatus[] = ["AVAILABLE", "RESERVED"];

export function isPropertyStatus(value?: string | null): value is PropertyStatus {
  return !!value && value in propertyStatusLabels;
}
