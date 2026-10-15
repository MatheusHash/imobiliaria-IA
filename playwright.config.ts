import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env.test") });

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Limitado mesmo fora do CI: contra um `next dev` real, muitos workers disputando a
  // compilação sob demanda de rotas ainda não visitadas causava timeouts intermitentes
  // (por isso o webServer abaixo usa build de produção — mas o limite continua uma
  // salvaguarda razoável para não saturar o pool de conexões do Postgres).
  workers: process.env.CI ? 1 : 8,
  // "console-info-reporter" é a regra do projeto (cada teste anuncia o que está testando)
  // aplicada automaticamente a todo teste atual e futuro — ver e2e/reporters/console-info-reporter.ts.
  reporter: process.env.CI
    ? [["github"], ["./e2e/reporters/console-info-reporter.ts"]]
    : [["html"], ["./e2e/reporters/console-info-reporter.ts"]],
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/
    },
    {
      // Testes de contrato de API, sem browser (fixture `request`). Autenticam construindo
      // o cookie de sessão direto (lib/auth.ts createSessionToken), sem depender do storageState
      // salvo pelo projeto "setup" — por isso não tem `dependencies` aqui.
      name: "api",
      testDir: "./e2e/api",
      use: { baseURL }
    },
    {
      name: "chromium",
      testDir: "./e2e",
      testIgnore: /e2e\/api\/.*/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"]
    }
  ],
  webServer: {
    // Build de produção, não `next dev`: a compilação sob demanda do dev server, com
    // várias rotas sendo visitadas por workers em paralelo pela primeira vez ao mesmo
    // tempo, causava timeouts intermitentes só por contenção de CPU — não um bug real.
    command: `npx next build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL!,
      AUTH_SECRET: process.env.AUTH_SECRET!,
      NEXT_PUBLIC_SITE_URL: baseURL,
      WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER ?? ""
    }
  }
});
