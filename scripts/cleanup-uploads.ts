/**
 * Lista (e opcionalmente apaga) imagens em public/uploads que nenhum imóvel usa:
 * fotos removidas no formulário ou enviadas em cadastros que não foram salvos.
 *
 *   npm run uploads:cleanup            -> só lista (nada é apagado)
 *   npm run uploads:cleanup -- --apply -> apaga
 *
 * Arquivos com menos de 24h são ignorados (podem estar em um formulário aberto),
 * assim como placeholder.svg e as pastas seed-* do seed.
 */
import { readdir, rm, rmdir, stat } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { UPLOAD_DIR } from "../lib/storage";

const MIN_AGE_MS = 24 * 60 * 60 * 1000;
const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(fullPath) : Promise.resolve([fullPath]);
    })
  );
  return files.flat();
}

async function main() {
  const properties = await prisma.property.findMany({ select: { images: true } });
  const referenced = new Set(properties.flatMap((property) => property.images));

  const now = Date.now();
  const orphans: { file: string; publicPath: string; bytes: number }[] = [];

  for (const file of await listFiles(UPLOAD_DIR)) {
    const relative = path.relative(UPLOAD_DIR, file).split(path.sep).join("/");
    if (relative === "placeholder.svg" || relative.startsWith("seed-")) continue;

    const publicPath = `/uploads/${relative}`;
    if (referenced.has(publicPath)) continue;

    const info = await stat(file);
    if (now - info.mtimeMs < MIN_AGE_MS) continue;

    orphans.push({ file, publicPath, bytes: info.size });
  }

  const totalMb = (orphans.reduce((sum, orphan) => sum + orphan.bytes, 0) / 1024 / 1024).toFixed(1);
  orphans.forEach((orphan) => console.log(`${apply ? "apagando" : "órfã"}  ${orphan.publicPath}`));
  console.log(`\n${orphans.length} imagem(ns) sem uso, ${totalMb} MB.`);

  if (!apply) {
    if (orphans.length) console.log("Nada foi apagado. Rode com --apply para apagar.");
    return;
  }

  for (const orphan of orphans) {
    await rm(orphan.file);
    // Remove a pasta do imóvel se ficou vazia (rmdir falha se ainda houver arquivos).
    const dir = path.dirname(orphan.file);
    if (dir !== UPLOAD_DIR) await rmdir(dir).catch(() => undefined);
  }
  console.log("Concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
