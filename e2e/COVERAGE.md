# Cobertura de testes

Controle do que tem teste automatizado — E2E (Playwright, `e2e/`) e unitário (Vitest,
`lib/*.test.ts`) — e do que ainda falta. Serve de checklist para saber o que testar a
seguir e de guia para manter os testes em dia conforme o produto muda.

**Estado atual: 90 testes E2E (Playwright) + 100 testes unitários (Vitest), cobrindo toda
funcionalidade do produto** (site público, autenticação, e todo o painel administrativo).
Rode `npm run test:e2e` e `npm run test` para confirmar.

## Como manter isto atualizado

- **Implementou uma funcionalidade nova ou alterou o comportamento de uma existente?**
  Antes de considerar a tarefa concluída, atualize a linha correspondente nesta tabela
  (ou adicione uma linha nova) e crie/ajuste o teste em `e2e/` ou `lib/*.test.ts`. Se o
  teste ainda não foi escrito, marque a linha como `⚠️ Pendente` e descreva o que
  exatamente mudou, para quem for escrever o teste depois saber o que validar.
- **Mudou uma regra de negócio que um teste existente verifica?** Atualize o teste no
  mesmo commit da mudança — teste quebrado (ou, pior, teste que não quebra mas ficou
  verificando a regra antiga) não serve pra nada.
- **Não dá para testar agora (falta decisão de produto, dependência externa, etc.)?**
  Marque `❌ Sem teste` e registre o motivo na coluna de notas, em vez de deixar a tabela
  silenciosa sobre a lacuna.
- Ao abrir um PR que toca em `app/`, `lib/`, `components/` ou `prisma/schema.prisma`,
  revise se alguma linha desta tabela precisa mudar de status.

Status possíveis: `✅ Coberto` · `⚠️ Parcial` (cobre o caminho principal, falta algum caso) ·
`❌ Sem teste`.

## Infraestrutura de teste (ver `playwright.config.ts`, `prisma/seed-e2e.ts`)

- Banco dedicado `imobiliaria_test` (nunca o banco de dev) — `npm run test:e2e:db:setup`
  cria/migra/popula; roda automaticamente antes de `npm run test:e2e` (hook `pretest:e2e`).
  `prisma/seed-e2e.ts` recusa rodar (`assertTestDatabase`) se `DATABASE_URL` não parecer
  claramente um banco de teste — proteção depois de um incidente em que o seed rodou
  contra o banco de dev por engano.
- Seed cobre: os 4 papéis/situações de usuário (admin, corretor, desativado, senha
  provisória), todos os status de imóvel, volume suficiente para paginação (15 imóveis
  extras), uma regra de disponibilidade de visita ampla (todo dia da semana, 06h-22h) e
  **todos os módulos adicionais ligados** — a suíte existe para testar o produto inteiro,
  não a configuração comercial de um cliente específico (essa é a função de
  `prisma/seed.ts`).
- `webServer` roda `next build && next start`, não `next dev`: a compilação sob demanda
  do dev server, com várias rotas sendo visitadas por workers em paralelo ao mesmo tempo,
  causava timeouts intermitentes só por contenção de CPU.
- Projeto `api` (`e2e/api/`) testa contrato de API sem abrir browser, autenticando direto
  com um cookie de sessão assinado (`e2e/api/auth-helpers.ts` + `lib/auth.ts
  createSessionToken`) — mais rápido que passar pela UI de login para cada caso.
- **Armadilhas que já pegaram testes aqui, para não repetir:** (1) depois de um clique que
  dispara uma server action sem redirect/mensagem visível, não confie no DOM imediatamente
  após o clique (ele pode só refletir o que você mesmo setou) — use `expect.poll` na
  consulta ao banco; (2) nunca reabra `/login` na mesma `page`/contexto que ainda está
  autenticado — ele redireciona direto, sem mostrar o formulário; `clearCookies()` antes;
  (3) evite palavras do próprio texto de confirmação dentro dos dados de teste (ex.: um
  e-mail contendo "cancelado") — colide com `getByText` de propósito mais amplo na mesma
  página.

## Site público

| Funcionalidade | Status | Spec |
|---|---|---|
| Home — destaques e busca | ✅ Coberto | `e2e/public/home.spec.ts` |
| Listagem — filtros (tipo, transação, cidade, bairro, preço, quartos, vagas) | ✅ Coberto | `e2e/public/listing.spec.ts` |
| Listagem — ordenação (menor/maior preço) | ✅ Coberto | `e2e/public/listing.spec.ts` |
| Listagem — paginação | ✅ Coberto | `e2e/public/listing.spec.ts` |
| Listagem — busca por código redireciona para o imóvel | ✅ Coberto | `e2e/public/listing.spec.ts` |
| Detalhe — exibição (preço, características, descrição, localização) | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — redirect permanente de UUID antigo para código | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — avisos por status (reservado/vendido/alugado) | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — imóveis semelhantes | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — rascunho/inativo: 404 para anônimo, pré-visualização para a equipe | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — galeria de fotos (setas e miniaturas) | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — mapa (módulo "mapa") | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — simulador de financiamento | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Detalhe — agendamento de visita (widget aparece) | ✅ Coberto | `e2e/public/property-detail.spec.ts` |
| Formulário "Tenho interesse" — validação, criação de lead, imóvel reservado | ✅ Coberto | `e2e/public/interest-form.spec.ts`, `e2e/public/property-detail.spec.ts` |
| Alerta de novos imóveis — cadastro, confirmação, cancelamento, tokens inválidos, alerta já cancelado | ✅ Coberto | `e2e/public/alerts.spec.ts` |
| Agendamento de visita — escolher dia/horário e confirmar | ✅ Coberto | `e2e/admin/visits.spec.ts` |
| Agendamento de visita — conflito de horário (slot ocupado não aparece) | ✅ Coberto | `e2e/admin/visits.spec.ts` |

## Autenticação e controle de acesso

| Funcionalidade | Status | Spec |
|---|---|---|
| Login — sucesso, `next`, senha errada, usuário desativado, next absoluto ignorado | ✅ Coberto | `e2e/auth/login.spec.ts` |
| Login — rate limit (5 tentativas / janela) | ✅ Coberto (unitário) | `lib/rate-limit.test.ts` |
| Logout | ✅ Coberto | `e2e/auth/login.spec.ts` |
| Acesso anônimo a rotas `/admin/*` redireciona ao login | ✅ Coberto | `e2e/auth/access-control.spec.ts` |
| CORRETOR não acessa `/admin/corretores` (ADMIN-only) | ✅ Coberto | `e2e/auth/access-control.spec.ts` |
| Troca de senha obrigatória: força `/conta`, bloqueia bypass por URL, senha atual errada, troca com sucesso | ✅ Coberto | `e2e/auth/must-change-password.spec.ts` |
| `lib/auth.ts` — hash/verify de senha, assinatura/expiração/adulteração do token de sessão | ✅ Coberto (unitário) | `lib/auth.test.ts` |

## Painel administrativo

| Funcionalidade | Status | Spec |
|---|---|---|
| Imóveis — criar com upload de foto, editar, mudar status, duplicar, excluir | ✅ Coberto | `e2e/admin/properties-crud.spec.ts` |
| Imóveis — exclusão não derruba lead vinculado (`propertyId` vira null) | ✅ Coberto | `e2e/admin/properties-crud.spec.ts` |
| Imóveis — listar, filtrar por status, buscar por título/código | ✅ Coberto | `e2e/admin/properties-crud.spec.ts` |
| Leads — listar, mudar status, atribuir, "assumir lead" | ✅ Coberto | `e2e/admin/leads.spec.ts` |
| Leads — isolamento por papel (corretor só vê os seus/sem responsável) | ✅ Coberto | `e2e/admin/leads.spec.ts` |
| Visitas — disponibilidade (criar, (des)ativar, remover horário) | ✅ Coberto | `e2e/admin/visits.spec.ts` |
| Visitas — listar, confirmar status, isolamento por papel | ✅ Coberto | `e2e/admin/visits.spec.ts` |
| Corretores — criar (senha provisória), e-mail duplicado, desativar, redefinir senha | ✅ Coberto | `e2e/admin/corretores.spec.ts` |
| Corretores — impedir rebaixar/desativar a própria conta, ou remover o último admin | ❌ Sem teste | — (ver "O que fica de fora" abaixo) |
| Financiamento — configurar taxa/entrada/prazo, validação de intervalo, reflexo no simulador público | ✅ Coberto | `e2e/admin/financing.spec.ts` |
| Alertas (admin) — listar, ativar/desativar manualmente | ✅ Coberto | `e2e/admin/alertas.spec.ts` |
| Portais — marcar imóvel para portal, listar em `/admin/portais`, sincronizar (esqueleto) | ✅ Coberto (smoke) | `e2e/admin/portais.spec.ts` |
| Painel de indicadores — cards, "imóveis mais vistos", "leads recentes" | ✅ Coberto | `e2e/admin/indicadores.spec.ts` |

## API

| Funcionalidade | Status | Spec |
|---|---|---|
| `GET /api/properties`, `/api/properties/[id]` — filtros, 404 para rascunho/inexistente | ✅ Coberto | `e2e/api/public-properties.spec.ts` |
| `POST /api/properties/interesse` — sucesso, validação, imóvel inexistente | ✅ Coberto | `e2e/api/public-properties.spec.ts` |
| `/api/admin/*` — 401 sem sessão/usuário desativado, autorizado cria/edita/remove, 400 em payload inválido | ✅ Coberto | `e2e/api/admin-auth.spec.ts` |

## Testes unitários (Vitest, `npm run test`)

Lógica pura sem necessidade de browser: `lib/leads.test.ts`, `lib/modules.test.ts`,
`lib/property-status.test.ts`, `lib/financing.test.ts`, `lib/geocoding.test.ts`,
`lib/visits.test.ts`, `lib/alerts.test.ts`, `lib/portals.test.ts`, `lib/auth.test.ts`,
`lib/properties.test.ts`, `lib/rate-limit.test.ts`, `lib/validations.test.ts`,
`lib/utils.test.ts`. Ao alterar essas regras, atualize o teste unitário correspondente —
só volte à tabela de E2E acima se a mudança também afetar o comportamento visível na UI.

## O que fica fora de propósito

- **"Último admin não pode ser removido" e "não pode rebaixar/desativar a própria conta"**
  (`lib/users.ts` `checkAdminRemains`, `lib/user-actions.ts`) — a UI já impede isso
  (campos desabilitados quando `isSelf`), e o segundo cenário precisaria de dois admins
  manipulando a mesma conta. Baixo risco; candidato a teste unitário direto de
  `checkAdminRemains` se for revisitado.
- **Pixels exatos do redimensionamento de imagem** (`lib/storage.ts`, `sharp`) — testado
  que a imagem enviada aparece e tem a URL certa, não o conteúdo byte a byte.
- **Renderização interna do tile do mapa** (Leaflet/OpenStreetMap) — testado que o
  componente monta e recebe as coordenadas certas (`.leaflet-container` aparece), não o
  comportamento da biblioteca de terceiro nem o carregamento real dos tiles.
- **Formato real de integração com portais** — não existe ainda uma decisão de produto
  (ver `docs/modulos.md`, pergunta 5.4); testado o esqueleto que existe hoje (marcar
  imóvel, listar, sincronizar sempre retorna o erro documentado), não um formato
  hipotético de feed/API.
- **Getters/setters triviais e código do framework** (Next.js, Prisma) — não é código do
  projeto.

## CI

`.github/workflows/test.yml` roda dois jobs em todo push/PR para `main`:

- **`unit`** (Vitest) — tem o seu próprio Postgres de serviço + `prisma migrate deploy`
  (só schema, sem seed). É necessário porque algumas suítes em `lib/*.test.ts` — as
  marcadas "(integração, banco local)" em `alerts.test.ts`, `modules.test.ts`,
  `visits.test.ts` e `portals.test.ts` — leem/escrevem num Postgres real (cada uma cria e
  limpa os próprios dados). Localmente isso roda "de grátis" porque o `@prisma/client`
  carrega o `.env` da raiz sozinho; no CI não há `.env` (está no `.gitignore`), então sem
  esse serviço esses 4 arquivos falham com erro de conexão — foi exatamente isso que
  aconteceu antes dessa correção.
- **`e2e`** (Playwright) — Postgres de serviço próprio, build de produção, `prisma migrate
  deploy` + `prisma/seed-e2e.ts`. Publica o relatório HTML do Playwright como artefato
  quando algo falha.
