/**
 * Liga ou desliga um módulo adicional para esta instalação (ver docs/modulos.md, seção 2.2).
 * Operação da Chrodar — não há tela para isso no admin da imobiliária-cliente na v1.
 *
 *   npx tsx scripts/toggle-module.ts <moduleId> on|off
 *   npx tsx scripts/toggle-module.ts                 -> lista o estado de todos os módulos
 */
import { PrismaClient } from "@prisma/client";
import { ADDON_MODULE_IDS, MODULE_REGISTRY, type ModuleId } from "../lib/modules/registry";

const prisma = new PrismaClient();

async function listStatus() {
  const flags = await prisma.moduleFlag.findMany();
  const enabledById = new Map(flags.map((flag) => [flag.moduleId, flag.enabled]));

  console.log("Módulos adicionais desta instalação:\n");
  for (const moduleId of ADDON_MODULE_IDS) {
    const enabled = enabledById.get(moduleId) ?? false;
    console.log(`  [${enabled ? "x" : " "}] ${moduleId} — ${MODULE_REGISTRY[moduleId].name}`);
  }
}

async function main() {
  const [moduleIdArg, actionArg] = process.argv.slice(2);

  if (!moduleIdArg) {
    await listStatus();
    return;
  }

  if (!ADDON_MODULE_IDS.includes(moduleIdArg as ModuleId)) {
    console.error(`"${moduleIdArg}" não é um módulo adicional válido. Opções: ${ADDON_MODULE_IDS.join(", ")}`);
    process.exit(1);
  }

  if (actionArg !== "on" && actionArg !== "off") {
    console.error('Informe "on" ou "off" depois do identificador do módulo.');
    process.exit(1);
  }

  const moduleId = moduleIdArg as ModuleId;
  const enabled = actionArg === "on";

  await prisma.moduleFlag.upsert({
    where: { moduleId },
    create: { moduleId, enabled },
    update: { enabled }
  });

  console.log(`Módulo "${moduleId}" (${MODULE_REGISTRY[moduleId].name}) agora está ${enabled ? "LIGADO" : "DESLIGADO"}.`);
  console.log("O servidor em produção pode levar até 30s para refletir (cache em memória — ver lib/modules.ts).");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
