import { NextResponse } from "next/server";
import { createLead, leadSchema } from "@/lib/leads";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = await getClientIp();
  if (!checkRateLimit(`lead:${ip}`, 5, 10 * 60 * 1000).allowed) {
    return NextResponse.json({ message: "Muitos envios em pouco tempo. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const lead = await createLead(parsed.data);
  if (!lead) {
    return NextResponse.json({ message: "Imóvel não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: "Interesse registrado com sucesso." }, { status: 201 });
}
