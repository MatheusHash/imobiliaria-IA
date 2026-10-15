import { execFileSync } from "child_process";

// Garante que o banco de testes E2E exista no Postgres do docker-compose, roda as
// migrations e aplica o seed determinístico (prisma/seed-e2e.ts). Usado por
// `npm run test:e2e` (hook `pretest:e2e`) antes de subir a suíte Playwright.
const TEST_DB_NAME = "imobiliaria_test";

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  execFileSync(command, args, { stdio: "inherit", env });
}

function databaseExists(): boolean {
  try {
    const output = execFileSync(
      "docker",
      ["compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-tAc", `SELECT 1 FROM pg_database WHERE datname = '${TEST_DB_NAME}'`],
      { encoding: "utf8" }
    );
    return output.trim() === "1";
  } catch {
    return false;
  }
}

function main() {
  if (!databaseExists()) {
    console.log(`Criando banco de testes "${TEST_DB_NAME}"...`);
    run("docker", ["compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-c", `CREATE DATABASE ${TEST_DB_NAME}`]);
  }

  const testDatabaseUrl = `postgresql://postgres:postgres@localhost:5432/${TEST_DB_NAME}?schema=public`;
  const env = { ...process.env, DATABASE_URL: testDatabaseUrl };

  console.log("Aplicando migrations no banco de testes...");
  run("npx", ["prisma", "migrate", "deploy"], env);

  console.log("Populando banco de testes (prisma/seed-e2e.ts)...");
  run("npx", ["tsx", "prisma/seed-e2e.ts"], env);
}

main();
