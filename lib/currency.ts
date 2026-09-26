// Máscara de moeda BRL. Os dígitos digitados são lidos como centavos:
// "1" -> "R$ 0,01", "123456" -> "R$ 1.234,56".

// Limite de dígitos para caber no Decimal(12, 2) do banco.
const MAX_DIGITS = 12;

/** Formata um número (em reais) como "R$ 1.234,56". */
export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aplica a máscara ao texto digitado. Retorna "" quando não há dígitos. */
export function maskBRL(text: string) {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
  if (!digits) return "";
  return formatBRL(Number(digits) / 100);
}

/** Converte o texto mascarado ("R$ 1.234,56") no valor numérico (1234.56). */
export function unmaskBRL(masked: string) {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return null;
  return Number(digits) / 100;
}

/** Valor inicial do campo a partir de um número ou string decimal ("1234.56"). */
export function toMaskedBRL(value?: number | string | null) {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return "";
  return formatBRL(number);
}
