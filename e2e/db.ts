import { PrismaClient } from "@prisma/client";

// Cliente Prisma apontando para o banco de testes (DATABASE_URL vem de .env.test,
// carregado em playwright.config.ts). Usado pelos testes para ler dados que normalmente
// seriam entregues por e-mail (ex.: token de confirmação de alerta).
export const prisma = new PrismaClient();
