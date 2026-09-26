"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { formatBRL } from "@/lib/utils";

// Limite de dígitos para não ultrapassar o Decimal(12, 2) do banco.
const MAX_DIGITS = 12;

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "value" | "defaultValue" | "onChange"
> & {
  name: string;
  defaultValue?: number | string | null;
  /** 2 = digitação em centavos (R$ 1.234,56); 0 = apenas reais (R$ 1.234). */
  fractionDigits?: 0 | 2;
};

function toMinorUnits(value: number | string | null | undefined, factor: number) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * factor);
}

// A máscara é preenchida da direita para a esquerda, então o cursor fica sempre no fim.
function moveCaretToEnd(input: HTMLInputElement) {
  requestAnimationFrame(() => {
    const end = input.value.length;
    input.setSelectionRange(end, end);
  });
}

/**
 * Campo monetário com máscara BRL. Com `fractionDigits = 2`, digitar "123456" exibe
 * "R$ 1.234,56". O valor enviado no formulário fica em um input oculto com o mesmo
 * `name`, em formato decimal ("1234.56"), ou vazio quando o campo está em branco.
 */
export function CurrencyInput({
  name,
  defaultValue,
  fractionDigits = 2,
  placeholder,
  onFocus,
  onClick,
  ...props
}: CurrencyInputProps) {
  const factor = 10 ** fractionDigits;
  const [units, setUnits] = useState<number | null>(() => toMinorUnits(defaultValue, factor));

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
    setUnits(digits ? Number(digits) : null);
  }

  const value = units === null ? null : units / factor;

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? formatBRL(0, fractionDigits)}
        value={value === null ? "" : formatBRL(value, fractionDigits)}
        onChange={handleChange}
        onFocus={(event) => {
          moveCaretToEnd(event.currentTarget);
          onFocus?.(event);
        }}
        onClick={(event) => {
          moveCaretToEnd(event.currentTarget);
          onClick?.(event);
        }}
      />
      <input type="hidden" name={name} value={value === null ? "" : value.toFixed(fractionDigits)} />
    </>
  );
}
