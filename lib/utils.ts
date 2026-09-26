import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, transactionType?: string) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(value);

  return transactionType === "RENT" ? `${formatted}/mês` : formatted;
}

export function propertyTypeLabel(type: string) {
  const labels: Record<string, string> = {
    APARTMENT: "Apartamento",
    HOUSE: "Casa",
    COMMERCIAL: "Comercial",
    LAND: "Terreno"
  };
  return labels[type] ?? type;
}

export function transactionTypeLabel(type: string) {
  const labels: Record<string, string> = {
    SALE: "Venda",
    RENT: "Aluguel"
  };
  return labels[type] ?? type;
}
