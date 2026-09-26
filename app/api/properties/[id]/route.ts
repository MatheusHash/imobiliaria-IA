import { NextResponse } from "next/server";
import { getPropertyByCodeOrId } from "@/lib/properties";
import { PUBLIC_PAGE_STATUSES } from "@/lib/property-status";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const property = await getPropertyByCodeOrId(id);

  if (!property || !PUBLIC_PAGE_STATUSES.includes(property.status)) {
    return NextResponse.json({ message: "Imóvel não encontrado" }, { status: 404 });
  }

  return NextResponse.json(property);
}
