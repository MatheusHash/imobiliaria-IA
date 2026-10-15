import { beforeEach, expect } from "vitest";

/**
 * Regra do projeto: todo teste anuncia o que está testando via console.info, para quem lê
 * o output da suíte saber o que cada teste cobre sem precisar abrir o arquivo. Registrado
 * aqui (setupFiles, ver vitest.config.ts) para valer automaticamente em todo teste atual e
 * futuro — ninguém precisa lembrar de adicionar nada no corpo do teste. Equivalente ao
 * reporter do Playwright em e2e/reporters/console-info-reporter.ts.
 */
beforeEach(() => {
  // currentTestName já vem como "describe > describe > teste" quando há suítes aninhadas.
  console.info(`[unit] ${expect.getState().currentTestName}`);
});
