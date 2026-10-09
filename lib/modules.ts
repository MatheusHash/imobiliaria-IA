import { notFound } from "next/navigation";
import { prisma } from "./prisma";
import { MODULE_REGISTRY, type ModuleId } from "./modules/registry";

// Cache em memória de vida curta: evita bater no banco em toda requisição,
// mas ainda enxerga em poucos segundos uma troca feita por scripts/toggle-module.ts
// (processo separado do servidor Next.js em produção).
const CACHE_TTL_MS = 30_000;
const cache = new Map<ModuleId, { enabled: boolean; expiresAt: number }>();

async function fetchEnabled(id: ModuleId): Promise<boolean> {
  const flag = await prisma.moduleFlag.findUnique({ where: { moduleId: id } });
  return flag?.enabled ?? false;
}

/** true para módulos essenciais; para adicionais, consulta (com cache) a tabela ModuleFlag. */
export async function isModuleEnabled(id: ModuleId): Promise<boolean> {
  if (MODULE_REGISTRY[id].tier === "essential") return true;

  const cached = cache.get(id);
  if (cached && cached.expiresAt > Date.now()) return cached.enabled;

  const enabled = await fetchEnabled(id);
  cache.set(id, { enabled, expiresAt: Date.now() + CACHE_TTL_MS });
  return enabled;
}

export function clearModuleCache() {
  cache.clear();
}

/**
 * Para páginas, layouts e server actions: recusa o acesso (404) se o módulo
 * estiver desligado. `notFound()` não funciona em rotas de API (app/api/**)
 * — lá, chame `isModuleEnabled` direto e devolva um NextResponse 404/403.
 */
export async function requireModule(id: ModuleId): Promise<void> {
  if (!(await isModuleEnabled(id))) {
    notFound();
  }
}
