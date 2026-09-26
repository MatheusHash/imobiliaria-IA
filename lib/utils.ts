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

/** Máscara de telefone brasileiro: (35) 3333-4444 ou (35) 99999-8888. */
export function maskPhone(text: string) {
  const digits = text.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
