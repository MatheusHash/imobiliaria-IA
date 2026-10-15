// Credenciais fixas usadas pelo seed E2E (prisma/seed-e2e.ts) e pelas suítes Playwright.
// Vivem num módulo sem efeitos colaterais para poder ser importadas dos dois lados.
export const E2E_ADMIN = { email: "e2e-admin@primelar.com", password: "e2e-admin-123" };
export const E2E_CORRETOR = { email: "e2e-corretor@primelar.com", password: "e2e-corretor-123" };
export const E2E_INACTIVE = { email: "e2e-inativo@primelar.com", password: "e2e-inativo-123" };
// Corretor "fresco", nunca logado, com senha provisória — para testar o fluxo de troca
// de senha obrigatória sem interferir no storage state reutilizado de E2E_CORRETOR.
export const E2E_NOVO_CORRETOR = { email: "e2e-novo-corretor@primelar.com", password: "senha-provisoria-123" };
