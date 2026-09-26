# Prime Lar Imobiliária

Site de imobiliária: vitrine pública de imóveis + painel administrativo para cadastrar/editar imóveis.

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3 (componentes base em `components/ui/`)
- Prisma 5 + PostgreSQL 16 (via `docker-compose.yml`)
- Formulários com react-hook-form + zod (`lib/validations.ts`)

## Comandos
- `docker compose up -d` — sobe o PostgreSQL local
- `npm run dev` — servidor de desenvolvimento
- `npm run build` — `prisma generate` + build de produção
- `npm run lint`
- `npm run prisma:migrate` — cria/aplica migrações (`prisma migrate dev`)
- `npm run db:seed` — popula o banco (inclui o usuário admin, ver README)
- `npm run prisma:studio` — inspeciona o banco
- `npm run uploads:cleanup` — lista imagens sem uso em `public/uploads` (`-- --apply` para apagar)

## Estrutura
- `app/` — rotas. Públicas: `/`, `/imoveis`, `/imoveis/[id]`, `/login`. Admin: `/admin/imoveis/*`.
- `app/api/properties/*` — API pública; `app/api/admin/*` — API autenticada (checa `isRequestAuthenticated`).
- `lib/auth.ts` — autenticação própria: senha com PBKDF2 e sessão em cookie assinado com HMAC (`AUTH_SECRET`). Não usa NextAuth.
- `lib/properties.ts` — consultas de imóveis; `lib/actions.ts` — server actions.
- `components/properties/` — cards, grid, galeria, formulário, busca.
- `prisma/schema.prisma` — modelos `User` e `Property` (imagens são `String[]` de URLs/caminhos).
- Imóveis têm dois identificadores: `id` (UUID interno, usado no admin e nas APIs de escrita) e `code` (inteiro sequencial a partir de 1001, exibido ao cliente). URLs públicas usam o código: `/imoveis/1001`; links com UUID redirecionam.
- Uploads passam por `lib/storage.ts` (redimensiona para 1920px e converte para WebP com sharp) e são gravados em `public/uploads/<propertyId|_temp>/`; ao salvar o imóvel, as imagens de `_temp` vão para a pasta dele.
- Papéis: `ADMIN` (tudo, inclusive `/admin/usuarios`) e `CORRETOR` (imóveis e leads sem responsável ou próprios). Use `requireCurrentUser`/`requireAdmin` em páginas e actions e `getRequestUser` nas rotas `/api/admin/*`.
- Status do imóvel em `lib/property-status.ts`: o site lista só `AVAILABLE`; vendidos/alugados/reservados têm página com aviso; rascunho/inativo só para a equipe.

## Convenções
- Textos da interface e mensagens de erro em português (pt-BR).
- Estilização apenas com classes Tailwind; reutilizar `components/ui/` antes de criar novos.
- Validação de entrada com zod, compartilhada entre cliente e API.
- Variáveis de ambiente: `DATABASE_URL`, `AUTH_SECRET` (ver `.env.example`).
