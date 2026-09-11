import { NextResponse } from "next/server";
import { getPropertyById } from "@/lib/properties";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = await getPropertyById(id);

  if (!property) {
    return NextResponse.json({ message: "Imóvel não encontrado" }, { status: 404 });
  }

  return NextResponse.json(property);
}
