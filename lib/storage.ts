import { randomBytes } from "crypto";
import { mkdir, rename, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Toda a gravação de imagens passa por aqui. Para trocar o disco local por S3/R2,
// basta reimplementar estas funções mantendo as assinaturas.

const PUBLIC_DIR = path.join(process.cwd(), "public");
export const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
export const TEMP_FOLDER = "_temp";

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 80;
const SAFE_FOLDER = /^[A-Za-z0-9_-]{1,64}$/;

export function isSafeFolder(folder: string) {
  return SAFE_FOLDER.test(folder);
}

/**
 * Redimensiona (no máximo 1920px de largura), corrige a rotação da câmera e
 * converte para WebP. Retorna o caminho público, ex.: /uploads/_temp/abc.webp
 */
export async function saveImage(input: Buffer, folder: string) {
  if (!isSafeFolder(folder)) throw new Error("Pasta inválida");

  const output = await sharp(input, { animated: true })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}.webp`;
  const dir = path.join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), output);

  return { path: `/uploads/${folder}/${fileName}`, bytes: output.length };
}

/**
 * Move as imagens enviadas antes de o imóvel existir (pasta _temp) para a pasta
 * do imóvel. Caminhos que não estão em _temp (URLs externas, imagens já movidas)
 * são mantidos como estão. Retorna a lista atualizada, na mesma ordem.
 */
export async function moveTempImages(images: string[], propertyId: string) {
  if (!isSafeFolder(propertyId)) throw new Error("Imóvel inválido");

  const tempPrefix = `/uploads/${TEMP_FOLDER}/`;
  const targetDir = path.join(UPLOAD_DIR, propertyId);
  let createdDir = false;

  return Promise.all(
    images.map(async (image) => {
      const fileName = image.startsWith(tempPrefix) ? image.slice(tempPrefix.length) : null;
      if (!fileName || fileName.includes("/") || fileName.includes("..")) return image;

      if (!createdDir) {
        await mkdir(targetDir, { recursive: true });
        createdDir = true;
      }

      try {
        await rename(path.join(UPLOAD_DIR, TEMP_FOLDER, fileName), path.join(targetDir, fileName));
        return `/uploads/${propertyId}/${fileName}`;
      } catch {
        // Arquivo já movido ou inexistente: mantém o caminho original para não perder a referência.
        return image;
      }
    })
  );
}
