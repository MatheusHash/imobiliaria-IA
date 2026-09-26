import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isRequestAuthenticated } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const EXTENSIONS_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
};

export async function POST(request: Request) {
  if (!isRequestAuthenticated(request)) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const propertyId = formData.get("propertyId") as string | null;

    if (propertyId && !SAFE_ID.test(propertyId)) {
      return NextResponse.json({ message: "Imóvel inválido." }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    const targetDir = propertyId
      ? path.join(UPLOAD_DIR, propertyId)
      : path.join(UPLOAD_DIR, "_temp");

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }

    const uploaded: string[] = [];

    for (const file of files) {
      const ext = EXTENSIONS_BY_MIME[file.type];
      if (!ext) {
        return NextResponse.json(
          { message: `"${file.name}" não é uma imagem suportada (JPG, PNG, WebP, GIF ou AVIF).` },
          { status: 400 }
        );
      }
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(targetDir, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());

      await writeFile(filePath, buffer);

      uploaded.push(`/uploads/${propertyId ? `${propertyId}/` : "_temp/"}${fileName}`);
    }

    return NextResponse.json({ paths: uploaded }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Erro ao fazer upload." }, { status: 500 });
  }
}