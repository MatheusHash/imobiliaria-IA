import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const interestSchema = z.object({
  propertyId: z.string().uuid("Imóvel inválido"),
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  message: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = interestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) {
    return NextResponse.json({ message: "Imóvel não encontrado" }, { status: 404 });
  }

  // Por enquanto apenas registra no log — futuramente pode salvar em tabela ou enviar e-mail
  console.log("[Interesse]", parsed.data.name, parsed.data.email, "->", property.title);

  return NextResponse.json({ success: true, message: "Interesse registrado com sucesso." }, { status: 201 });
}