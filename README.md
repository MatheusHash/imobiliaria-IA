# Prime Lar Imobiliária

Sistema web inicial para imobiliária criado com Next.js App Router, TypeScript, Tailwind CSS, Prisma ORM e PostgreSQL.

## Como executar

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Ajuste `DATABASE_URL` no `.env` para seu PostgreSQL (ou suba o banco local com `docker compose up -d`) e defina um `AUTH_SECRET` aleatório.

3. Instale as dependências, aplique as migrações e popule o banco:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

4. Rode o projeto:

```bash
npm run dev
```

## Credenciais de acesso

Após executar o seed, utilize estas credenciais na página `/login`:

- **E-mail:** `admin@primelar.com`
- **Senha:** `admin123`

## Rotas principais

- `/` Página inicial com hero, busca e imóveis em destaque.
- `/imoveis` Listagem pública com filtros via query params.
- `/imoveis/[id]` Detalhes do imóvel e formulário de interesse.
- `/admin/imoveis` Listagem administrativa com busca e ações.
- `/admin/imoveis/novo` Cadastro de imóvel.
- `/admin/imoveis/[id]/editar` Edição de imóvel.
- `/login` Página de login para acesso administrativo.
- `/api/properties` API pública para listagem e busca de imóveis.
- `/api/properties/[id]` API pública para detalhes de um imóvel.
- `/api/properties/interesse` API pública para envio de formulário de interesse.
- `/api/admin/properties` API privada (autenticada) para criar imóveis.
- `/api/admin/properties/[id]` API privada (autenticada) para atualizar e remover imóveis.

## Observações

- Upload de imagens foi modelado como lista de URLs, conforme solicitado.
- As páginas que consultam o banco são dinâmicas para evitar prerender sem `DATABASE_URL` em ambiente de build.
