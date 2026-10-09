import { afterEach, describe, expect, it } from "vitest";
import { clearModuleCache, isModuleEnabled } from "./modules";
import { prisma } from "./prisma";

async function setFlag(moduleId: string, enabled: boolean) {
  await prisma.moduleFlag.upsert({
    where: { moduleId },
    create: { moduleId, enabled },
    update: { enabled }
  });
  clearModuleCache();
}

describe("isModuleEnabled", () => {
  afterEach(async () => {
    // Devolve o estado esperado em dev/seed, para não deixar o banco local fora do padrão.
    await setFlag("visitas", false);
  });

  it("módulo essencial está sempre ligado, mesmo sem linha em ModuleFlag", async () => {
    expect(await isModuleEnabled("vitrine")).toBe(true);
  });

  it("módulo adicional sem linha em ModuleFlag é tratado como desligado", async () => {
    await prisma.moduleFlag.deleteMany({ where: { moduleId: "visitas" } });
    clearModuleCache();
    expect(await isModuleEnabled("visitas")).toBe(false);
  });

  it("reflete o valor gravado em ModuleFlag", async () => {
    await setFlag("visitas", true);
    expect(await isModuleEnabled("visitas")).toBe(true);

    await setFlag("visitas", false);
    expect(await isModuleEnabled("visitas")).toBe(false);
  });

  it("usa o cache em memória entre leituras (não reflete uma troca direta no banco antes de invalidar)", async () => {
    await setFlag("visitas", false);
    expect(await isModuleEnabled("visitas")).toBe(false);

    await prisma.moduleFlag.update({ where: { moduleId: "visitas" }, data: { enabled: true } });
    expect(await isModuleEnabled("visitas")).toBe(false); // ainda em cache

    clearModuleCache();
    expect(await isModuleEnabled("visitas")).toBe(true); // após invalidar, lê de novo
  });
});
