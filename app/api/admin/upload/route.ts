import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { isSafeFolder, saveImage, TEMP_FOLDER } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getRequestUser(request))) {
    return NextResponse.json({ message: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const propertyId = formData.get("propertyId");

    if (typeof propertyId === "string" && propertyId && !isSafeFolder(propertyId)) {
      return NextResponse.json({ message: "Imóvel inválido." }, { status: 400 });
    }

    if (!files.length) {
      return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          { message: `"${file.name}" não é uma imagem suportada (JPG, PNG, WebP, GIF ou AVIF).` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ message: `"${file.name}" é maior que 15 MB.` }, { status: 400 });
      }
    }

    const folder = typeof propertyId === "string" && propertyId ? propertyId : TEMP_FOLDER;
    const uploaded: string[] = [];

    for (const file of files) {
      try {
        const saved = await saveImage(Buffer.from(await file.arrayBuffer()), folder);
        uploaded.push(saved.path);
      } catch {
        // O tipo declarado pelo navegador não garante o conteúdo: o sharp rejeita arquivos que não são imagem.
        return NextResponse.json({ message: `Não foi possível processar "${file.name}".` }, { status: 400 });
      }
    }

    return NextResponse.json({ paths: uploaded }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ message: "Erro ao fazer upload." }, { status: 500 });
  }
}
