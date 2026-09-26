import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  if (!(await getRequestUser(request))) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = propertySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const property = await prisma.property.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ...property, price: Number(property.price) });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!(await getRequestUser(request))) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  await prisma.property.delete({ where: { id } });
  return NextResponse.json({ message: "Imóvel removido" });
}