import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProperties } from "@/lib/properties";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const properties = await getProperties({
    type: searchParams.get("type") ?? undefined,
    transactionType: searchParams.get("transactionType") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    q: searchParams.get("q") ?? undefined
  });

  return NextResponse.json(properties);
}