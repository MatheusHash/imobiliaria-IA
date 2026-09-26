"use client";

import { useState } from "react";
import { Input } from "@/components/ui/field";
import { maskBRL, toMaskedBRL, unmaskBRL } from "@/lib/currency";

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "value" | "defaultValue" | "onChange"
> & {
  name: string;
  defaultValue?: number | string | null;
};

// A máscara preenche da direita para a esquerda, então o cursor fica sempre no fim.
function moveCaretToEnd(input: HTMLInputElement) {
  requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
}

/**
 * Campo de texto com máscara BRL aplicada enquanto o usuário digita.
 * O usuário vê "R$ 1.234,56"; o formulário envia "1234.56" por um input
 * oculto com o mesmo `name` (vazio quando o campo está em branco).
 */
export function CurrencyInput({ name, defaultValue, placeholder = "R$ 0,00", ...props }: CurrencyInputProps) {
  const [masked, setMasked] = useState(() => toMaskedBRL(defaultValue));
  const value = unmaskBRL(masked);

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={masked}
        onChange={(event) => {
          setMasked(maskBRL(event.target.value));
          moveCaretToEnd(event.target);
        }}
        onFocus={(event) => moveCaretToEnd(event.target)}
        onClick={(event) => moveCaretToEnd(event.currentTarget)}
      />
      <input type="hidden" name={name} value={value === null ? "" : value.toFixed(2)} />
    </>
  );
}
