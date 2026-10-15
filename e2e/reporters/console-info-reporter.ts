import type { Reporter, TestCase } from "@playwright/test/reporter";

/**
 * Regra do projeto: toda execução de teste anuncia o que está testando via console.info,
 * para quem lê o output da suíte (localmente ou no CI) saber o que cada teste cobre sem
 * precisar abrir o arquivo. Implementado aqui (reporter), não dentro de cada `test()`, para
 * valer automaticamente em todo teste atual e futuro — ninguém precisa lembrar de adicionar
 * nada no corpo do teste. Ver convenção equivalente para Vitest em `vitest.setup.ts`.
 */
export default class ConsoleInfoReporter implements Reporter {
  onTestBegin(test: TestCase) {
    // titlePath(): ["", <projeto>, <arquivo>, ...describes, <título do teste>].
    // Os dois primeiros (raiz e nome do projeto) não ajudam a descrever o teste; descartados.
    const description = test.titlePath().slice(2).join(" › ");
    console.info(`[e2e] ${description}`);
  }
}
