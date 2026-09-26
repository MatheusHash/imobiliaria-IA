# Roteiro de funcionalidades — Prime Lar Imobiliária

> Levantamento feito em 26/09/2026 a partir do código da `main`.
> Prioridades: **P1** = necessário para operar de verdade · **P2** = melhora a experiência · **P3** = diferencial.

## Sumário

- [Ponto crítico: leads estão sendo perdidos](#ponto-crítico-leads-estão-sendo-perdidos)
- [Visão geral](#visão-geral)
- [P1 — Essencial](#p1--essencial)
- [P2 — Experiência](#p2--experiência)
- [P3 — Diferenciais](#p3--diferenciais)
- [Decisões de arquitetura](#decisões-de-arquitetura)
- [Ordem de implementação sugerida](#ordem-de-implementação-sugerida)

---

## Ponto crítico: leads estão sendo perdidos

O formulário **"Tenho interesse"** da página do imóvel (`app/imoveis/[id]/page.tsx`) não tem `action` nem `onSubmit`. Ao clicar em "Enviar interesse", o navegador apenas recarrega a página com os dados na URL.

A API `app/api/properties/interesse/route.ts` existe, mas não é chamada por nenhuma tela e só faz `console.log`.

**Impacto:** todo contato de cliente interessado é perdido. É o problema mais urgente do sistema.

---

## Visão geral

```
  CLIENTE (público)                        ADMIN (equipe)
  ─────────────────                        ──────────────
  Busca / filtros ──┐                 ┌── Imóveis (CRUD + status)
  Página do imóvel ─┼──► Next.js ◄────┼── Leads (caixa de entrada)
  Contato/WhatsApp ─┘     │           ├── Usuários e papéis
                          │           └── Dashboard
                   ┌──────┴───────┐
                   │  PostgreSQL  │  Property, User, Lead, (AuditLog)
                   └──────┬───────┘
                   Armazenamento de imagens (hoje: disco local)
```

---

## P1 — Essencial

### 1. Leads (contatos de interesse)

**Modelo de dados**

```prisma
enum LeadStatus {
  NEW          // Novo
  IN_PROGRESS  // Em atendimento
  CONVERTED    // Convertido
  LOST         // Perdido
}

model Lead {
  id           String     @id @default(uuid())
  propertyId   String
  property     Property   @relation(fields: [propertyId], references: [id])
  name         String
  email        String
  phone        String
  message      String?    @db.Text
  status       LeadStatus @default(NEW)
  assignedToId String?
  assignedTo   User?      @relation(fields: [assignedToId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([status])
  @@index([propertyId])
}
```

**Tarefas**

- [x] Formulário da página do imóvel salva o lead via server action (mesmo padrão do cadastro de imóveis)
- [x] Mensagem de sucesso/erro para o cliente
- [x] Tela `/admin/leads` com filtro por status e por imóvel
- [x] Botão "Responder no WhatsApp" (`https://wa.me/55...`) em cada lead
- [x] Anti-spam: campo honeypot + limite de envios por IP

### 2. Usuários e papéis

**Modelo de dados** (alterações em `User`)

```prisma
enum Role {
  ADMIN     // gerencia usuários e tudo o mais
  CORRETOR  // gerencia imóveis e vê apenas os próprios leads
}

model User {
  // ...campos atuais
  role               Role    @default(CORRETOR)
  active             Boolean @default(true)
  phone              String? // WhatsApp exibido no imóvel
  mustChangePassword Boolean @default(false)
}
```

**Tarefas**

- [ ] `/admin/usuarios`: listar, criar, editar e **desativar** (não excluir — imóveis e leads continuam vinculados)
- [ ] Admin define senha provisória; usuário troca no primeiro acesso (`mustChangePassword`)
- [ ] Tela "Minha conta" para trocar a própria senha
- [ ] Guardas de permissão por papel nas páginas, server actions e rotas de API
- [ ] **Correção de segurança:** `isRequestAuthenticated` (rotas `/api/admin/*`) só valida a assinatura do cookie. Precisa consultar o banco e verificar se o usuário existe e está `active` — senão um usuário desativado mantém acesso por até 7 dias
- [ ] Limite de tentativas de login (ex.: 5 tentativas / 15 min por e-mail + IP)

**Trade-off — senha provisória × convite por e-mail**

| | Senha provisória | Convite por e-mail |
|---|---|---|
| Complexidade | Baixa | Média (serviço de e-mail, tokens com expiração) |
| Segurança | Admin conhece a senha inicial | Admin nunca vê a senha |
| Recomendação | **Agora** | Quando houver envio de e-mail no sistema |

### 3. Status do imóvel

- [ ] Campo `status`: `DRAFT` (rascunho), `AVAILABLE` (disponível), `RESERVED` (reservado), `SOLD` (vendido), `RENTED` (alugado), `INACTIVE` (inativo)
- [ ] Site público lista apenas `AVAILABLE`
- [ ] Links de imóveis vendidos/alugados mostram aviso e sugerem imóveis semelhantes (em vez de 404)
- [ ] Hoje a única opção é excluir, o que apaga histórico e quebraria o vínculo com leads

### 4. Campos que faltam em imóveis no Brasil

- [ ] Condomínio e IPTU (usar o `CurrencyInput` existente)
- [ ] Vagas de garagem
- [ ] Mobiliado, aceita pet
- [ ] Características/comodidades (piscina, churrasqueira, portaria 24h, elevador…) — lista de checkboxes

---

## P2 — Experiência

### Site público

- [ ] **Preview no WhatsApp/redes sociais:** `generateMetadata` + Open Graph por imóvel (título, preço, foto). Hoje todas as páginas têm o mesmo título genérico
- [ ] **Botão "Falar no WhatsApp"** com mensagem pronta: *"Olá, tenho interesse no imóvel 1001"*
- [ ] **Filtros adicionais:** quartos, vagas, bairro
- [ ] **Ordenação:** menor preço, maior preço, mais recentes
- [ ] **Paginação** — hoje a listagem carrega todos os imóveis de uma vez
- [ ] **Mapa** na página do imóvel a partir do endereço
- [ ] Páginas institucionais: Sobre, Contato, **Anuncie seu imóvel** (captação de proprietários)
- [ ] `sitemap.xml` e `robots.txt` para SEO

### Admin

- [ ] **Dashboard:** imóveis por status, leads novos na semana, imóveis mais vistos
- [ ] **Imagens:** reordenar, escolher a capa, redimensionar/comprimir no upload
- [ ] Mover imagens de `_temp` para a pasta do imóvel ao salvar (hoje ficam em `_temp` para sempre) e limpar órfãs
- [ ] **Duplicar imóvel** para cadastrar unidades semelhantes

---

## P3 — Diferenciais

| Funcionalidade | Por que ajuda | Esforço |
|---|---|---|
| Favoritos sem login (salvos no navegador) | Cliente compara e volta ao site | Baixo |
| Alerta de novos imóveis ("me avise quando surgir casa em Passos até R$ 300 mil") | Gera leads recorrentes | Médio |
| Agendamento de visita com escolha de horário | Transforma o lead em visita marcada | Médio |
| Simulador de financiamento (tabelas SAC/Price) | Mantém o cliente no site | Baixo |
| Exportação para portais (XML ZAP/VivaReal/OLX) | Anunciar nos portais sem redigitar | Médio |
| Histórico de alterações (quem mudou preço/status) | Controle com vários corretores | Baixo |
| Descrição gerada por IA a partir dos dados do imóvel | Economiza tempo do corretor | Baixo |

---

## Decisões de arquitetura

### Armazenamento de imagens

Hoje as imagens são gravadas em `public/uploads/` no disco local.

- **Funciona** em VPS/servidor próprio.
- **Não funciona** em hospedagens serverless (ex.: Vercel), onde o disco é temporário e os arquivos somem.

**Recomendação:** decidir a hospedagem antes de publicar. Em qualquer caso, isolar a gravação de arquivos num único módulo (`lib/storage.ts`) para que a troca por S3 / Cloudflare R2 seja simples no futuro.

### Sessão

A sessão é um cookie assinado sem registro no banco (stateless).

- **Vantagem:** simples e rápido.
- **Limitação:** não permite derrubar a sessão de um usuário específico.

**Recomendação:** com poucos usuários, consultar `active` no banco a cada requisição autenticada resolve. Se o número de usuários crescer ou for preciso "sair de todos os dispositivos", criar uma tabela `Session`.

### Testes

Antes de implementar papéis e permissões, criar testes para as regras de acesso (quem pode ver/editar o quê). É a área onde um erro custa mais caro.

---

## Ordem de implementação sugerida

Cada item vira uma branch `feature/...`, integrada na `main` ao final.

| # | Entrega | Branch sugerida | Prioridade |
|---|---|---|---|
| 1 | Leads funcionando (formulário + tela no admin) | `feature/leads` | P1 |
| 2 | Usuários e papéis + correção das rotas admin + limite de login | `feature/usuarios` | P1 |
| 3 | Status do imóvel + campos brasileiros | `feature/status-e-campos-imovel` | P1 |
| 4 | Preview no WhatsApp, botão de WhatsApp, filtros e paginação | `feature/experiencia-cliente` | P2 |
| 5 | Dashboard e melhorias de imagens | `feature/dashboard-admin` | P2 |
| 6 | Diferenciais, conforme demanda dos clientes | — | P3 |

### A revisitar conforme o sistema crescer

- Tabela `Session` (revogação de sessões)
- Armazenamento de imagens em nuvem
- Busca textual mais rica (full-text search do PostgreSQL) quando o catálogo passar de algumas centenas de imóveis
- Cache das páginas públicas (hoje todas são `force-dynamic`)
