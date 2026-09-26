import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations";

export async function POST(request: Request) {
  if (!(await getRequestUser(request))) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = propertySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const property = await prisma.property.create({ data: parsed.data });
  return NextResponse.json({ ...property, price: Number(property.price) }, { status: 201 });
}