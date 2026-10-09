# Chrodar Gestão Imobiliária — Módulos do produto

> Documento de planejamento. **Não contém código de produção** — é a base para decidir a lógica de habilitação de módulos e para especificar os módulos que ainda faltam, antes de implementar qualquer um deles.
>
> Feito a partir do código da branch `main` em 08/10/2026 (commit `4bfd711`).

## Sumário

- [1. O que já existe hoje (auditoria)](#1-o-que-já-existe-hoje-auditoria)
- [2. Lógica de habilitação de módulos](#2-lógica-de-habilitação-de-módulos)
- [3. Especificação dos módulos que faltam](#3-especificação-dos-módulos-que-faltam)
- [4. Ordem de implementação proposta](#4-ordem-de-implementação-proposta)
- [5. Perguntas que precisam de uma decisão do dono do produto](#5-perguntas-que-precisam-de-uma-decisão-do-dono-do-produto)

---

## 1. O que já existe hoje (auditoria)

### Pacote Essencial

**1. Site com vitrine de imóveis**
- Listagem pública: [app/imoveis/page.tsx](../app/imoveis/page.tsx), busca em [components/properties/search-form.tsx](../components/properties/search-form.tsx), grade em [components/properties/property-grid.tsx](../components/properties/property-grid.tsx).
- Filtros e paginação: [lib/properties.ts](../lib/properties.ts) (`buildPropertyWhere`, `getPropertiesPage`) — filtra por tipo, transação, cidade/bairro, faixa de preço, quartos mínimos e vagas mínimas; `PAGE_SIZE = 12`; ordenação em `sortOptions` (mais recentes, menor preço, maior preço).
- Tabela: `Property` ([prisma/schema.prisma](../prisma/schema.prisma)).
- **Igual à descrição.** Não há diferenças relevantes.

**2. Página completa do imóvel**
- [app/imoveis/[id]/page.tsx](../app/imoveis/%5Bid%5D/page.tsx): galeria ([components/properties/property-gallery.tsx](../components/properties/property-gallery.tsx)), condomínio/IPTU (`condoFee`, `iptu`), comodidades (`amenities`, ver [lib/amenities.ts](../lib/amenities.ts)), código curto (`Property.code`, inteiro sequencial a partir de 1001).
- "Prévia no WhatsApp": implementada como metadados Open Graph (`generateMetadata`, linhas 20 e 41 do arquivo acima) — qualquer rede social que leia OG (WhatsApp, Facebook, Telegram) usa a mesma prévia; não é algo específico do WhatsApp.
- **Diferença a registrar:** existe uma segunda rota de API para o mesmo fim, [app/api/properties/interesse/route.ts](../app/api/properties/interesse/route.ts), que duplica a validação de `lib/leads.ts` mas **não é chamada por nenhuma tela** — o formulário usa a server action `createLeadAction` ([lib/actions.ts](../lib/actions.ts)). É código morto hoje; motivo documentado no `docs/ROADMAP.md` atual (era o bug crítico, já corrigido pelo lado da action, mas a rota antiga não foi removida).

**3. Gestão de imóveis**
- CRUD em [app/admin/imoveis/*](../app/admin/imoveis), schema de validação em [lib/validations.ts](../lib/validations.ts), server actions em [lib/actions.ts](../lib/actions.ts) (`createPropertyAction`, `updatePropertyAction`, `duplicatePropertyAction`, `deletePropertyAction`).
- Fotos otimizadas: [lib/storage.ts](../lib/storage.ts) (`sharp`, redimensiona para 1920px, converte para WebP).
- **Diferença a registrar:** o enum `PropertyStatus` tem **6** valores (`DRAFT`, `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`, `INACTIVE`), não 4 como no resumo do pacote — os 4 citados existem, mais rascunho e inativo. Regras de visibilidade por status em [lib/property-status.ts](../lib/property-status.ts).

**4. Leads e WhatsApp**
- Formulário: [components/leads/interest-form.tsx](../components/leads/interest-form.tsx) → `createLeadAction` ([lib/actions.ts](../lib/actions.ts)) → `createLead` ([lib/leads.ts](../lib/leads.ts)).
- Caixa de leads: [app/admin/leads/page.tsx](../app/admin/leads/page.tsx), com filtro por status e botão de WhatsApp (`whatsappLink`, em `lib/leads.ts`).
- Tabela: `Lead`. Anti-spam: honeypot + `checkRateLimit` ([lib/rate-limit.ts](../lib/rate-limit.ts)).
- **Igual à descrição**, com a ressalva do item 2 (rota de API duplicada e não usada).

### Módulos adicionais já existentes

**5. Equipe de corretores**
- Telas: [app/admin/corretores/*](../app/admin/corretores). Lógica: [lib/users.ts](../lib/users.ts), [lib/user-actions.ts](../lib/user-actions.ts).
- `User.role` (`ADMIN`/`CORRETOR`), `photo`, `phone`, `creci`, `active`, `mustChangePassword`. Upload de avatar com recorte 512×512 via `kind=avatar` em [app/api/admin/upload/route.ts](../app/api/admin/upload/route.ts).
- Escopo de dados por papel: `leadScope` em [lib/leads.ts](../lib/leads.ts) — admin vê tudo, corretor vê leads sem responsável + os próprios.
- **Mais completo que a descrição:** além de "foto e CRECI", já existe desativação (sem exclusão), senha provisória com troca obrigatória, limite de tentativas de login e a regra "não pode sobrar zero administradores ativos" (`checkAdminRemains`).

**6. Painel de indicadores**
- [app/admin/page.tsx](../app/admin/page.tsx): imóveis por status (`prisma.property.groupBy`), leads novos da semana, leads por status, 5 imóveis mais vistos (`Property.viewCount`).
- **Igual à descrição.**

### Observações gerais da auditoria

- Não existe `middleware.ts` — toda a proteção de página é feita chamando `requireCurrentUser`/`requireAdmin` ([lib/auth.ts](../lib/auth.ts)) no topo de cada página/layout do admin, e `getRequestUser` no topo de cada rota `/api/admin/*`. Isso importa para a seção 2: qualquer novo "guarda de módulo" tem que seguir o mesmo padrão (chamada explícita no topo de cada página/action/rota), porque é assim que o projeto já faz autorização.
- **Não existe nenhum conceito de cliente/tenant no código.** Não há coluna `tenantId`, nem tabela `Tenant`/`Organization`, nem qualquer filtro "por imobiliária" em nenhuma query. `AUTH_SECRET`, `WHATSAPP_NUMBER` e `NEXT_PUBLIC_SITE_URL` são variáveis de ambiente globais do processo ([lib/site.ts](../lib/site.ts), [.env.example](../.env.example)). Isso é o dado mais importante para a decisão da seção 2.1.
- Não há nenhuma suíte de testes automatizados no `package.json` hoje (sem Jest/Vitest/Playwright configurado).
- O sistema não envia e-mail hoje (nenhuma dependência de SMTP/provedor de e-mail). Isso afeta diretamente os módulos 10 (alertas) e, em menor grau, o 7 (confirmação de visita).

---

## 2. Lógica de habilitação de módulos

### 2.1 Modelo de clientes: uma instalação por imobiliária, ou várias imobiliárias num sistema só?

O código atual **favorece fortemente uma instalação (deploy + banco) por imobiliária-cliente**:

- Nenhuma tabela tem `tenantId`. Adotar multi-tenant com banco compartilhado exigiria adicionar essa coluna a `Property`, `User` e `Lead`, e revisar **toda** query Prisma do projeto (`lib/properties.ts`, `lib/leads.ts`, `lib/users.ts`, `lib/actions.ts`, todas as rotas `/api/*`) para filtrar por tenant — um esquecimento em uma única query vaza dados de um cliente para outro. É um retrabalho grande e de alto risco num sistema que hoje não tem suíte de testes.
- A sessão (cookie HMAC, `lib/auth.ts`) não carrega identificação de tenant — teria que ser adicionada e validada em todo lugar que hoje confia só no `userId`.
- `AUTH_SECRET`, número de WhatsApp e URL do site são globais ao processo — em multi-tenant cada cliente precisaria do próprio número de WhatsApp, domínio e, idealmente, segredo de sessão, o que já é natural em "um processo por cliente" e exigiria uma camada de configuração por tenant no modelo compartilhado.
- Cada imobiliária-cliente normalmente quer **domínio próprio, marca própria, corretores próprios** — não há benefício de UX em dividir infraestrutura.

| | Uma instalação por imobiliária (recomendado) | Sistema único multi-tenant |
|---|---|---|
| Esforço para chegar lá a partir do código atual | Baixo — é como o código já está | Alto — rescrever a camada de dados e a sessão |
| Isolamento de dados entre clientes | Total (bancos diferentes) | Depende de nunca esquecer o filtro por tenant em nenhuma query |
| Operação (deploy, backup, atualização) | Um processo e um banco por cliente — custo cresce com o número de clientes | Um processo só — mais barato de operar em escala |
| Ajuste fino por cliente (domínio, número de WhatsApp, variáveis) | Natural (variáveis de ambiente por deploy) | Precisa de tabela de configuração por tenant |
| Quando trocar de ideia | Se/quando o número de clientes ficar grande e o custo de operar N bancos pesar mais que o risco da reescrita | — |

**Recomendação:** manter **uma instalação por imobiliária** agora. A lógica de módulos da seção 2.2 em diante assume esse modelo: "habilitar um módulo" é uma operação **dentro de um deploy/banco de um cliente**, não uma linha numa tabela de milhares de tenants. Se o número de clientes crescer a ponto de o custo operacional de N bancos pesar mais que o risco de uma reescrita multi-tenant, isso deve ser tratado como um projeto separado e maior (ver pergunta 5.1).

### 2.2 Onde fica a configuração de módulos ligados/desligados

Três opções, dado o modelo "uma instalação por cliente":

| Opção | Troca exige novo deploy? | Auditável (quem mudou e quando)? | Quem pode operar |
|---|---|---|---|
| Variável de ambiente (`.env`) | Sim | Não | Só quem tem acesso ao servidor |
| Arquivo de configuração versionado no repo | Sim (e gera conflito de merge entre clientes, se o repo for compartilhado) | Via git, mas misturado com código | Só quem faz deploy |
| **Tabela no banco (recomendado)** | **Não** | **Sim** (`updatedAt`, pode logar quem mudou) | Chrodar hoje; cliente no futuro, se quiser |

**Recomendado: tabela `ModuleFlag` no banco de cada cliente.**

```prisma
model ModuleFlag {
  id        String   @id @default(uuid())
  /// Identificador estável do módulo, ver registro central (ex.: "visitas", "portais").
  moduleId  String   @unique
  enabled   Boolean  @default(false)
  updatedAt DateTime @updatedAt
}
```

Motivo: é a única opção que permite ligar/desligar um módulo **sem reimplantar o sistema** (importante para suporte: "o cliente atrasou o pagamento, desative o módulo X agora"), e fica junto dos dados do próprio cliente (consistente com o modelo "uma instalação por imobiliária").

**Quem pode alterar:** recomenda-se que, na v1, **só a Chrodar** escreva em `ModuleFlag` — via `npx prisma studio` ou um script interno simples (`scripts/toggle-module.ts <id> on|off`), não via UI do cliente. O administrador da imobiliária só **visualiza** o que está contratado (ex.: uma seção "Módulos" em `/admin`, somente leitura, com um aviso "fale com a Chrodar para contratar"). Justificativa: evita construir cobrança/contrato dentro do produto agora; a tabela já deixa pronto o caminho para, no futuro, um botão de autoatendimento escrever na mesma `ModuleFlag` depois que existir fluxo de pagamento.

### 2.3 Registro central de módulos

Um arquivo de código (não uma tabela — isso é metadado do **produto**, igual para todo cliente, e deve viajar com o deploy) lista todos os módulos que existem, independente de estarem ligados:

```ts
// lib/modules/registry.ts
export type ModuleId =
  | "vitrine" | "pagina-imovel" | "gestao-imoveis" | "leads" // essenciais
  | "corretores" | "indicadores"                              // adicionais já existentes
  | "visitas" | "portais" | "financiamento" | "alertas" | "mapa"; // adicionais a fazer

export type ModuleDefinition = {
  id: ModuleId;
  name: string;
  tier: "essential" | "addon";
  /** Módulos de que este depende (dados ou telas). Essenciais sempre satisfeitos. */
  dependsOn: ModuleId[];
  description: string;
};

export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  vitrine:        { id: "vitrine", name: "Vitrine de imóveis", tier: "essential", dependsOn: [], description: "..." },
  "pagina-imovel":{ id: "pagina-imovel", name: "Página do imóvel", tier: "essential", dependsOn: ["vitrine"], description: "..." },
  "gestao-imoveis":{ id: "gestao-imoveis", name: "Gestão de imóveis", tier: "essential", dependsOn: [], description: "..." },
  leads:          { id: "leads", name: "Leads e WhatsApp", tier: "essential", dependsOn: ["pagina-imovel"], description: "..." },
  corretores:     { id: "corretores", name: "Equipe de corretores", tier: "addon", dependsOn: ["leads"], description: "..." },
  indicadores:    { id: "indicadores", name: "Painel de indicadores", tier: "addon", dependsOn: ["leads", "gestao-imoveis"], description: "..." },
  visitas:        { id: "visitas", name: "Agendamento de visitas", tier: "addon", dependsOn: ["pagina-imovel"], description: "..." },
  portais:        { id: "portais", name: "Integração com portais", tier: "addon", dependsOn: ["gestao-imoveis"], description: "..." },
  financiamento:  { id: "financiamento", name: "Simulador de financiamento", tier: "addon", dependsOn: ["pagina-imovel"], description: "..." },
  alertas:        { id: "alertas", name: "Alerta de novos imóveis", tier: "addon", dependsOn: ["vitrine"], description: "..." },
  mapa:           { id: "mapa", name: "Mapa do imóvel", tier: "addon", dependsOn: ["pagina-imovel"], description: "..." }
};
```

Resposta à pergunta de exemplo do pedido original — **"o Painel depende de Leads?"**: sim, conceitualmente (usa contagem de leads e de imóveis), mas como `leads` e `gestao-imoveis` são **essenciais** (sempre ligados), essa dependência nunca bloqueia nada na prática hoje. A declaração em `dependsOn` serve para documentação e para o dia em que algo essencial deixar de ser essencial (não é o caso previsto aqui). Hoje **nenhum módulo adicional depende de outro módulo adicional** — todos os 5 que faltam (visitas, portais, financiamento, alertas, mapa) são independentes entre si.

Módulos essenciais existem no registro (para os adicionais poderem referenciá-los), mas não têm linha em `ModuleFlag` — a função de checagem (seção 2.4) trata todo módulo `tier: "essential"` como sempre ligado, sem consultar o banco.

### 2.4 Como um módulo desligado some de verdade, em cada camada

Dois pontos de checagem únicos, reaproveitados em todo o sistema (mesmo padrão que `requireCurrentUser`/`getRequestUser` já usam hoje):

```ts
// lib/modules.ts
export async function isModuleEnabled(id: ModuleId): Promise<boolean> { /* essential → true; addon → lê ModuleFlag, com cache curto */ }
export async function requireModule(id: ModuleId): Promise<void> { /* se desligado: notFound() ou redirect */ }
```

| Camada | Como o módulo desliga de verdade | Exemplo |
|---|---|---|
| Menu e telas do admin | `app/admin/layout.tsx` monta a lista de `AdminNavItem` filtrando por `isModuleEnabled` **no servidor**, antes de renderizar — mesmo padrão já usado hoje para esconder "Corretores" de quem não é admin | item "Visitas" só aparece no array se `await isModuleEnabled("visitas")` |
| Páginas do admin do módulo | Cada página chama `requireModule(id)` logo após `requireCurrentUser`, igual ao padrão atual de `requireAdmin` | `app/admin/visitas/page.tsx` → `await requireModule("visitas")` → `notFound()` se desligado |
| Páginas e componentes do site público | O bloco é renderizado **no servidor**; se desligado, o componente nem entra no HTML (não é CSS escondendo) | bloco de mapa em `/imoveis/[id]` só renderiza se `await isModuleEnabled("mapa")` |
| Rotas de API e server actions | Primeira linha da função, antes de tocar no Prisma, igual ao padrão de `getRequestUser` | `app/api/admin/visitas/route.ts` e a action de agendar visita retornam 404/403 se desligado — **nunca** só escondem o botão que chama a rota |
| Tarefas agendadas / integrações | O cron/job verifica `isModuleEnabled` antes de fazer qualquer chamada externa ou escrita, e registra em log que pulou por módulo desligado | o job de sincronização com portais não publica nada se `portais` estiver desligado, mesmo que ainda exista `PortalListing` configurado |

A regra geral pedida no enunciado — "devem recusar o acesso, não só esconder o botão" — fica garantida porque a página/rota/action em si recusa; a ausência no menu é só uma consequência (boa UX), nunca a única barreira.

### 2.5 O que acontece com os dados quando um módulo é desligado e depois religado

**Nada é apagado.** Desligar um módulo é **só** a troca `ModuleFlag.enabled = false`. Nenhuma outra escrita acontece:

- As tabelas do módulo (ex.: `Visit`, `PortalListing`, `PropertyAlert`) continuam intactas; só ficam inacessíveis pelas camadas da seção 2.4.
- Religar o módulo (`enabled = true`) restaura o acesso aos mesmos dados imediatamente — sem migração, sem reimportação.
- Único cuidado: efeitos **externos** que o módulo já causou (ex.: um anúncio já publicado no portal ZAP) não são desfeitos automaticamente ao desligar — isso exigiria chamar a API externa para remover o anúncio, o que pode falhar e não é um "apagar dado interno". Tratar como processo manual na v1 ("avisar o cliente para retirar do portal") e documentar como melhoria futura.

### 2.6 Como os módulos aparecem no SEO e no sitemap quando desligados

- [app/sitemap.ts](../app/sitemap.ts) e [app/robots.ts](../app/robots.ts) hoje só listam imóveis (`LISTED_STATUSES`) — nenhum dos módulos 7-11 cria uma rota pública indexável própria, **exceto** o módulo 10 (Alerta de novos imóveis), que precisa de uma página pública para cadastrar o alerta.
- Regra geral: qualquer URL pública que um módulo adicional contribua para o sitemap deve passar pelo mesmo `isModuleEnabled` antes de entrar no array retornado por `sitemap()` — nunca listar uma URL que vai retornar 404.
- A própria página, se existir, deve responder **404 de verdade** (`notFound()`) quando o módulo está desligado — não "200 com uma mensagem" — para os buscadores desindexarem corretamente em vez de guardar em cache uma página quebrada.
- `robots.ts` não precisa mudar por módulo: ele já bloqueia `/admin`, `/api`, `/login`, `/conta` de forma genérica; páginas públicas de módulos adicionais entram na liberação geral (`allow: "/"`) só quando existirem e estiverem ligadas.

### 2.7 Como testar: cada módulo ligado e desligado, sem quebrar o Essencial

O projeto não tem suíte de testes hoje — isso precisa entrar **antes** da lógica de módulos (ver passo 1 da migração, seção 2.8). Com ela:

1. **Teste do próprio mecanismo:** `isModuleEnabled`/`requireModule` — ligado passa, desligado recusa (403/404/redirect, conforme a camada).
2. **Por módulo adicional**, no mínimo dois testes de integração:
   - Ligado: o caminho principal funciona de ponta a ponta (página renderiza, action/rota aceita a operação).
   - Desligado: página retorna 404, action/rota recusa, item de menu não aparece, URL não aparece no sitemap (quando aplicável).
3. **Suíte de regressão do Essencial**, rodada no CI a cada PR **independentemente do que está sendo alterado**: com todos os módulos adicionais desligados, os quatro fluxos essenciais continuam de pé — busca pública, página do imóvel, cadastro/edição de imóvel, envio de lead + botão de WhatsApp. Essa suíte existir e passar é o critério que impede um módulo adicional de se tornar, por acidente, uma dependência do Essencial.

### 2.8 Passos de migração do código atual para essa lógica, sem quebrar o que está no ar

Ordem pensada para que cada passo, isoladamente, não mude nenhum comportamento em produção até o momento em que isso é intencional:

1. **Base de testes.** Adicionar um runner (Vitest, por ser o mais leve para projetos Next.js/TS) e alguns testes de fumaça dos quatro fluxos essenciais. Puramente aditivo.
2. **Tabela `ModuleFlag` + migração Prisma.** `prisma migrate dev`, com seed marcando `corretores` e `indicadores` (os dois que já existem) como `enabled: true`. Aditivo — nenhuma tela ainda consulta essa tabela.
3. **`lib/modules/registry.ts` e `lib/modules.ts`** (`isModuleEnabled`, `requireModule`, com cache em memória de vida curta para não bater no banco em toda requisição). Ainda aditivo — nada chama essas funções ainda.
4. **Encaixar os dois módulos que já existem** (`corretores`, `indicadores`) nas checagens: `requireModule` nas páginas, filtro no menu. Como ambos nascem `enabled: true` no seed, **o comportamento em produção não muda** — este passo só prova que a tubulação funciona antes de qualquer módulo poder ser desligado de verdade.
5. **Teste de aceite do mecanismo**, em ambiente local/staging: desligar `indicadores` ou `corretores` manualmente na tabela e confirmar que o menu, a página direta por URL, a action e o sitemap (se aplicável) reagem corretamente, e que religar devolve tudo sem perda. Só depois disso o mecanismo é considerado confiável para sustentar módulos novos.
6. **A partir daqui, construir os módulos 7 a 11 já nascendo atrás de `requireModule`/`isModuleEnabled`** — nunca como um "acoplar depois".
7. **Processo operacional da Chrodar** para ligar/desligar módulo por cliente (script `scripts/toggle-module.ts` é suficiente para a v1; uma tela interna de administração entre clientes pode vir depois, quando houver volume que justifique).

---

## 3. Especificação dos módulos que faltam

> Nenhum destes módulos está implementado hoje. Nenhuma IA é usada ou proposta em nenhum deles.

### 3.1 Módulo 7 — Agendamento de visitas

**Objetivo (linguagem de quem compra):** o cliente marca o horário da visita direto no site, sem trocar mensagens para combinar.

**Histórias de uso**
- *Visitante:* na página do imóvel, escolhe um horário livre numa grade de dias/horários e confirma com nome, telefone e e-mail; vê a confirmação na hora.
- *Corretor:* vê a própria agenda de visitas, confirma/cancela, marca como realizada ou "não compareceu"; configura os horários em que está disponível.
- *Administrador:* vê a agenda de todos os corretores, reatribui uma visita para outro corretor, define horários padrão da imobiliária para imóveis sem corretor responsável.

**Telas e mudanças**
- Site público: bloco "Agendar visita" em `/imoveis/[id]`, com seletor de data/horário e formulário de confirmação (mesmo padrão visual do formulário de interesse atual).
- Admin: nova rota `/admin/visitas` (lista com filtro por status/data/corretor, ações de confirmar/cancelar) e uma tela de disponibilidade (janelas de horário recorrentes por corretor).
- Dashboard (módulo 6, se ligado): card opcional "Visitas da semana" — não é exigido pelo módulo 7 funcionar sem o painel de indicadores ligado.

**Modelo de dados**
```prisma
model VisitSlotRule {
  id          String   @id @default(uuid())
  userId      String?  // null = regra geral da imobiliária (sem corretor específico)
  user        User?    @relation(fields: [userId], references: [id])
  weekday     Int      // 0 (domingo) a 6 (sábado)
  startTime   String   // "09:00"
  endTime     String   // "12:00"
  slotMinutes Int      @default(30)
  active      Boolean  @default(true)
}

enum VisitStatus { PENDING CONFIRMED CANCELED DONE NO_SHOW }

model Visit {
  id           String      @id @default(uuid())
  propertyId   String
  property     Property    @relation(fields: [propertyId], references: [id])
  leadId       String?
  lead         Lead?       @relation(fields: [leadId], references: [id])
  scheduledFor DateTime
  status       VisitStatus @default(PENDING)
  visitorName  String
  visitorPhone String
  visitorEmail String
  assignedToId String?
  assignedTo   User?       @relation(fields: [assignedToId], references: [id])
  notes        String?     @db.Text
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  @@index([propertyId])
  @@index([scheduledFor])
  @@index([assignedToId])
  @@unique([assignedToId, scheduledFor]) // evita dois visitantes no mesmo horário do mesmo corretor
}
```

**Integrações externas:** nenhuma obrigatória na v1 (cálculo de disponibilidade e confirmação são internos). Opcional: confirmação automática por e-mail (precisa de provedor de e-mail transacional, que o sistema não tem hoje — ver módulo 10) ou por WhatsApp (precisa de WhatsApp Business API, com custo por conversa e aprovação prévia da Meta — bem mais caro e lento de contratar que o botão `wa.me` usado hoje). Ver pergunta 5.3.

**LGPD:** coleta nome/telefone/e-mail do visitante — mesma natureza de dado já coletado em `Lead`, mesma base legal (o titular pediu a visita). Adicionar consentimento explícito no formulário (hoje nem o formulário de interesse tem esse texto — oportunidade de padronizar os dois juntos). Reter enquanto o imóvel existir ou por prazo definido (sugestão: 24 meses após a visita), com exclusão sob pedido.

**Dependências:** nenhuma de outro módulo adicional. Se o módulo "Equipe de corretores" estiver desligado, toda visita cai sem corretor responsável (fica só a agenda geral da imobiliária).

**Tamanho estimado:** M. **Riscos:** concorrência de horário (dois visitantes marcando o mesmo slot ao mesmo tempo — mitigado pelo `@@unique` acima, mas a ação de criar precisa tratar o erro de unicidade com uma mensagem amigável); fuso horário/horário de verão; falta de lembrete automático aumenta não comparecimento.

**Critérios de aceite:** visitante só vê horários realmente livres; não é possível marcar dois compromissos no mesmo horário para o mesmo corretor; cancelar devolve o horário à grade imediatamente; admin e corretor veem e atualizam o status; o módulo desligado remove o bloco da página pública e a rota `/admin/visitas` sem apagar nenhuma visita já registrada.

---

### 3.2 Módulo 8 — Integração com portais (ZAP, VivaReal, OLX)

**Objetivo (linguagem de quem compra):** os anúncios vão para os portais automaticamente, sem redigitar nada.

**Histórias de uso**
- *Corretor/administrador:* marca, no cadastro do imóvel, quais portais devem receber aquele anúncio; acompanha se cada envio teve sucesso ou erro.
- *Administrador:* configura, uma vez, as credenciais/feed de cada portal contratado.
- *Visitante:* não interage com este módulo — vê o imóvel no portal como vê no site, sem telas novas no site público.

**Telas e mudanças**
- Admin: seção "Portais" no formulário do imóvel (um checkbox + status por portal) e uma tela `/admin/portais` com a configuração de credenciais/feed e o histórico de sincronizações (sucesso/erro, com data e motivo).
- Nenhuma mudança no site público.

**Modelo de dados**
```prisma
enum PortalName { ZAP VIVAREAL OLX }
enum PortalSyncStatus { PENDING SYNCED ERROR }

model PortalListing {
  id         String           @id @default(uuid())
  propertyId String
  property   Property         @relation(fields: [propertyId], references: [id])
  portal     PortalName
  enabled    Boolean          @default(true)
  status     PortalSyncStatus @default(PENDING)
  externalId String?          // id do anúncio no portal, quando a integração devolve um
  lastSyncAt DateTime?
  lastError  String?          @db.Text

  @@unique([propertyId, portal])
}

model PortalCredential {
  id        String     @id @default(uuid())
  portal    PortalName @unique
  config    Json        // chaves/tokens específicos do portal — avaliar criptografia em repouso
  updatedAt DateTime   @updatedAt
}
```

**Integrações externas:** o formato padrão do mercado brasileiro é um **feed XML** num endereço que o portal busca periodicamente (ZAP e VivaReal pertencem ao mesmo grupo e, em muitos planos, aceitam um feed comum; OLX Imóveis tem formato próprio), ou, em planos maiores, uma **API de integração direta**. Qual das duas formas existe depende do plano comercial que a imobiliária-cliente já tem com cada portal — isso **não dá para decidir pelo código**, é uma decisão comercial por cliente. Ver pergunta 5.4.

**LGPD:** o feed carrega dados do imóvel e da imobiliária, não dados pessoais de leads/visitantes — risco baixo. Avaliar se o endereço completo deve ir ao portal ou só bairro/rua (prática comum do setor, por segurança do imóvel).

**Dependências:** "Gestão de imóveis" (essencial) — precisa dos campos do imóvel completos. Nenhuma dependência de outro módulo adicional.

**Tamanho estimado:** G. **Riscos:** cada portal pode mudar o formato do feed sem aviso prévio; é preciso uma tabela de tradução entre os valores internos (`PropertyType`, `TransactionType`, `amenities`) e os valores esperados por cada portal, que se torna dívida técnica a cada mudança externa; falha de sincronização de um imóvel não pode travar os demais.

**Critérios de aceite:** o feed/chamada gerado é aceito pelo portal escolhido; desligar um portal para um imóvel reflete na próxima sincronização; erro num imóvel aparece no histórico sem impedir os outros; desligar o módulo todo para o cliente para as sincronizações sem apagar `PortalListing`/`PortalCredential`.

---

### 3.3 Módulo 9 — Simulador de financiamento (SAC e Price)

**Objetivo (linguagem de quem compra):** o cliente simula as parcelas do financiamento sem sair da página do imóvel.

**Histórias de uso**
- *Visitante:* na página do imóvel, informa entrada e prazo, escolhe SAC ou Price, vê a tabela/resumo das parcelas estimadas.
- *Administrador:* configura a taxa de juros e a entrada mínima sugeridas (não há cotação bancária em tempo real neste módulo).
- *Corretor:* não interage diretamente.

**Telas e mudanças**
- Site público: bloco "Simule seu financiamento" em `/imoveis/[id]` — entrada, prazo em meses, taxa (pré-preenchida com o padrão configurado, editável), tabela SAC/Price.
- Admin: campo de configuração (taxa padrão a.a., entrada mínima %) — pode ficar numa tela simples de "Configurações" ou dentro da própria tela de módulos.

**Modelo de dados**
```prisma
model FinancingSettings {
  id                String   @id @default(uuid())
  defaultRateYearly Decimal  @db.Decimal(5, 2) // ex.: 10.50 (% a.a.)
  minDownPaymentPct Decimal  @db.Decimal(5, 2) // ex.: 20.00 (%)
  maxMonths         Int      @default(420)
  updatedAt         DateTime @updatedAt
}
```
Registro único por instalação (coerente com o modelo "uma instalação por imobiliária" da seção 2.1) — não precisa de tabela por simulação, pois o cálculo de SAC/Price é determinístico e pode ser refeito a qualquer momento a partir do preço do imóvel e dos parâmetros informados pelo visitante.

**Integrações externas:** nenhuma obrigatória — amortização SAC e Price são fórmulas fechadas, sem depender de nenhum banco ou serviço externo. Ver pergunta 5.5 sobre taxa fixa vs. buscada de alguma fonte externa (ex.: Selic/Bacen) — opcional, não necessário para a v1.

**LGPD:** nenhum dado pessoal novo é coletado — a simulação é anônima. Se no futuro for adicionado "enviar simulação por e-mail", esse fluxo passa a coletar e-mail e deve ser tratado com as mesmas regras de consentimento do módulo 10.

**Dependências:** nenhuma — roda isolado dentro da página do imóvel (essencial).

**Tamanho estimado:** P. **Riscos:** o resultado pode ser lido como garantia de aprovação — é obrigatório exibir aviso de que é uma estimativa, sujeita a análise do banco.

**Critérios de aceite:** SAC e Price calculam corretamente para casos de teste conhecidos (ex.: entrada 20%, 360 meses, 10% a.a.); o aviso "simulação aproximada" está sempre visível; mudar o valor do imóvel ou os parâmetros recalcula sem recarregar a página.

---

### 3.4 Módulo 10 — Alerta de novos imóveis

**Objetivo (linguagem de quem compra):** o cliente diz o que procura e recebe um aviso quando surgir um imóvel assim.

**Histórias de uso**
- *Visitante:* na busca, salva os filtros atuais com um e-mail; confirma o e-mail (link enviado); a partir daí recebe um aviso sempre que um imóvel novo bater com o filtro, e pode cancelar com um clique.
- *Administrador:* vê quantos alertas existem e quais filtros são mais pedidos; pode desativar um alerta reportado como abuso/spam.
- *Corretor:* não interage diretamente.

**Telas e mudanças**
- Site público: botão "Me avise de novos imóveis assim" na busca (`/imoveis`), com mini-formulário (e-mail + confirmação dos filtros atuais); página de confirmação de e-mail e página de cancelamento (link presente em todo e-mail enviado).
- Admin: tela `/admin/alertas` com a lista de alertas ativos e ação de desativar.

**Modelo de dados**
```prisma
model PropertyAlert {
  id             String   @id @default(uuid())
  email          String
  filters        Json     // mesmo formato usado na busca pública (PropertyFilters)
  confirmed      Boolean  @default(false)
  confirmToken   String   @unique
  cancelToken    String   @unique
  active         Boolean  @default(true)
  lastNotifiedAt DateTime?
  createdAt      DateTime @default(now())

  @@index([email])
  @@index([active, confirmed])
}
```
Processo: uma tarefa agendada (diária, ou disparada a cada imóvel novo/atualizado) varre alertas `active && confirmed`, reaplica os mesmos filtros da busca pública contra imóveis criados após `lastNotifiedAt`, envia um e-mail por correspondência e atualiza `lastNotifiedAt`.

**Integrações externas:** um provedor de e-mail transacional (ex.: Resend, SendGrid, Amazon SES) — **hoje o sistema não envia nenhum e-mail**, então isso é infraestrutura nova para o produto como um todo, não só para este módulo (e pode ser reaproveitada depois para outras notificações). Ver pergunta 5.6.

**LGPD:** e-mail é dado pessoal — exige consentimento explícito (caixa de seleção não pré-marcada) e **double opt-in** (confirma antes do primeiro envio). Todo e-mail precisa de link de cancelamento de um clique, sem exigir login. Definir prazo de retenção (sugestão: excluir alerta não confirmado após 7 dias; excluir alerta inativo sem interação há mais de 24 meses).

**Dependências:** "Site com vitrine" (essencial, para os filtros). Nenhuma dependência de outro módulo adicional.

**Tamanho estimado:** M. **Riscos:** sem provedor de e-mail configurado, o módulo não entrega nada por si só — é um pré-requisito de infraestrutura, não um detalhe de implementação; picos de envio se muitos alertas baterem com um imóvel novo de uma vez (considerar lote/fila se o volume crescer).

**Critérios de aceite:** nenhum e-mail é enviado antes da confirmação; o mesmo imóvel nunca é enviado duas vezes para o mesmo alerta; o link de cancelamento funciona sem login; os filtros salvos no alerta são exatamente os mesmos critérios da busca pública.

---

### 3.5 Módulo 11 — Mapa do imóvel

**Objetivo (linguagem de quem compra):** o cliente vê no mapa onde o imóvel está, sem abrir outro site.

**Histórias de uso**
- *Visitante:* na página do imóvel, vê um mapa com a localização aproximada (bairro/rua, sem necessariamente marcar o número exato — ver LGPD abaixo).
- *Corretor/administrador:* ao cadastrar/editar o imóvel, confirma ou ajusta manualmente o ponto no mapa, já que a geocodificação automática por endereço pode errar.

**Telas e mudanças**
- Site público: bloco de mapa em `/imoveis/[id]`, abaixo do endereço/bairro.
- Admin: no formulário do imóvel, campo de localização com geocodificação automática ao salvar o endereço + mapa interativo para arrastar e corrigir o pino manualmente.

**Modelo de dados** — adição de colunas em `Property`, sem tabela nova:
```prisma
model Property {
  // ...campos atuais
  latitude   Float?
  longitude  Float?
  geocodedAt DateTime?
}
```

**Integrações externas:** um serviço de mapas/geocodificação. Opções do mercado: Google Maps Platform (cobrança por requisição acima de uma cota gratuita mensal, exige chave de API e cartão), Mapbox (cota gratuita maior, cobrança por carregamento de mapa) ou OpenStreetMap + Leaflet com Nominatim para geocodificação (sem custo direto, mas com política de uso que limita volume e não garante disponibilidade). A escolha afeta custo recorrente por cliente-imobiliária e precisa ser decidida pelo dono do produto — ver pergunta 5.7.

**LGPD:** coordenadas de um imóvel não são dado pessoal de um lead/visitante, mas podem expor a privacidade do morador atual se o pino for exato — recomenda-se mostrar o ponto com uma aproximação (ex.: centro da quadra/bairro), prática comum em portais do setor, em vez do endereço exato.

**Dependências:** nenhuma de outro módulo adicional — usa o endereço já existente no imóvel (essencial).

**Tamanho estimado:** P (se o admin digitar lat/long manualmente, sem geocodificação automática) a M (com geocodificação automática a partir do endereço). **Riscos:** endereços incompletos ou ambíguos geram geocodificação errada; dependência de serviço externo — o mapa precisa de um estado de "indisponível" que não quebre o resto da página.

**Critérios de aceite:** imóvel sem coordenadas não quebra a página (o bloco de mapa simplesmente não aparece); endereços de teste reais resultam num ponto plausível; admin consegue corrigir manualmente um pino errado; o uso do serviço de mapas fica dentro do limite contratado (monitorado).

---

## 4. Ordem de implementação proposta

1. **Lógica de habilitação de módulos** (seção 2) — pré-requisito de tudo o resto; sem ela, qualquer módulo novo nasce sem forma de ser vendido separadamente.
2. **Módulo 9 — Simulador de financiamento** (P, sem integração externa obrigatória, maior razão esforço/valor percebido pelo cliente).
3. **Módulo 11 — Mapa do imóvel** (P/M, uma integração externa simples e muito esperada pelo visitante de imóveis).
4. **Módulo 7 — Agendamento de visitas** (M, sem integração obrigatória, transforma lead em visita marcada — alto valor comercial).
5. **Módulo 10 — Alerta de novos imóveis** (M, mas depende de montar infraestrutura de e-mail que o produto não tem — fazer depois de validar o modelo de dados dos módulos mais simples).
6. **Módulo 8 — Integração com portais** (G, maior esforço e maior dependência de decisões comerciais externas ao time — fazer por último e só depois de fechado o(s) portal(is)/plano(s) alvo).

---

## 5. Perguntas que precisam de uma decisão do dono do produto

1. **Escala de clientes:** quantas imobiliárias-cliente são esperadas no primeiro ano? Isso valida (ou não) a recomendação de "uma instalação por cliente" da seção 2.1 — se o número for muito grande, vale planejar uma migração futura para multi-tenant como projeto separado.
2. **Quem pode alterar módulos:** confirma que, na v1, só a Chrodar liga/desliga módulos (seção 2.2), com o administrador da imobiliária apenas visualizando o que está contratado? Ou já é necessário algum autoatendimento?
3. **Confirmação de visita (módulo 7):** a confirmação deve ser só na tela (v1, sem custo) ou também por e-mail/WhatsApp automático? Automação por WhatsApp exige WhatsApp Business API, com custo por conversa e aprovação prévia da Meta.
4. **Portais (módulo 8):** quais portais (ZAP, VivaReal, OLX) o cliente-alvo já assina, e com qual tipo de plano — feed XML agendado ou API de integração direta? Isso decide o formato técnico da integração e se há custo adicional por portal.
5. **Taxa de financiamento (módulo 9):** taxa fixa configurada manualmente pelo admin (v1) ou buscada de alguma fonte externa (ex.: Selic/Bacen)? A segunda opção é opcional e pode vir depois.
6. **Provedor de e-mail (módulo 10, e infraestrutura do produto em geral):** qual serviço usar (Resend, SendGrid, SES ou outro) e com qual remetente — domínio da Chrodar ou domínio do cliente? Afeta custo, limites de envio e entregabilidade.
7. **Serviço de mapas (módulo 11):** Google Maps, Mapbox ou OpenStreetMap/Leaflet? Decide custo recorrente por cliente e se cada imobiliária paga a própria chave de API ou se a Chrodar centraliza uma chave para todos (nesse caso, precisa de limite de uso por cliente).
