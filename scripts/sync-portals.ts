/**
 * Sincroniza todos os anúncios habilitados com os portais (ver lib/portals.ts). O
 * formato real de cada portal ainda não está definido (docs/modulos.md, módulo 8,
 * pergunta 5.4) — hoje isso só exercita o fluxo de status/erro documentado. Pensado
 * para rodar como tarefa agendada (ex.: cron diário) quando o formato real existir.
 *
 *   npx tsx scripts/sync-portals.ts
 */
import { syncAllEnabledListings } from "../lib/portals";
import { prisma } from "../lib/prisma";
import { isModuleEnabled } from "../lib/modules";

async function main() {
  if (!(await isModuleEnabled("portais"))) {
    console.log("Módulo 'portais' desligado — nada a sincronizar.");
    return;
  }

  const { synced } = await syncAllEnabledListings();
  console.log(`Anúncios processados: ${synced}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
