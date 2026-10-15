import { PrismaClient, PropertyType, TransactionType } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { ADDON_MODULE_IDS } from "../lib/modules/registry";
import { E2E_ADMIN, E2E_CORRETOR, E2E_INACTIVE, E2E_NOVO_CORRETOR } from "../e2e/credentials";

// Seed determinístico usado pelos testes E2E (ver e2e/COVERAGE.md). Diferente de
// prisma/seed.ts: cobre todos os papéis/situações de usuário, todos os status de imóvel,
// tem volume suficiente para paginação, e liga todos os módulos adicionais (a suíte E2E
// existe para testar o produto inteiro, não uma configuração comercial específica).
const prisma = new PrismaClient();

const properties = [
  {
    title: "Apartamento E2E disponível",
    description: "Imóvel de teste usado pela suíte E2E para validar listagem, busca e página de detalhe.",
    price: 500000,
    type: PropertyType.APARTMENT,
    transactionType: TransactionType.SALE,
    bedrooms: 2,
    bathrooms: 2,
    area: 70,
    city: "Cidade E2E",
    neighborhood: "Bairro Disponível",
    address: "Rua dos Testes, 100",
    featured: true,
    parkingSpaces: 1,
    petFriendly: true,
    amenities: ["pool", "gym"],
    // Duas fotos de propósito: é o imóvel usado pelo teste de navegação da galeria.
    images: ["/uploads/e2e/disponivel-1.svg", "/uploads/e2e/disponivel-2.svg"],
    // Coordenadas fixas (praça da Sé, SP) só para o módulo "mapa" ter o que desenhar.
    latitude: -23.5505,
    longitude: -46.6333,
    geocodedAt: new Date()
  },
  {
    title: "Casa E2E reservada",
    description: "Imóvel de teste com status reservado, usado para validar o aviso de indisponibilidade.",
    price: 800000,
    type: PropertyType.HOUSE,
    transactionType: TransactionType.SALE,
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    city: "Cidade E2E",
    neighborhood: "Bairro Reservado",
    address: "Rua dos Testes, 200",
    status: "RESERVED" as const,
    parkingSpaces: 2,
    amenities: [],
    images: ["/uploads/e2e/reservada-1.svg"]
  },
  {
    title: "Sala E2E vendida",
    description: "Imóvel de teste com status vendido, usado para validar que não aceita mais interesse.",
    price: 300000,
    type: PropertyType.COMMERCIAL,
    transactionType: TransactionType.SALE,
    bedrooms: 0,
    bathrooms: 1,
    area: 40,
    city: "Cidade E2E",
    neighborhood: "Bairro Vendido",
    address: "Rua dos Testes, 300",
    status: "SOLD" as const,
    parkingSpaces: 0,
    amenities: [],
    images: ["/uploads/e2e/vendida-1.svg"]
  },
  {
    title: "Terreno E2E rascunho",
    description: "Imóvel de teste em rascunho, usado para validar que não aparece para visitantes anônimos.",
    price: 100000,
    type: PropertyType.LAND,
    transactionType: TransactionType.SALE,
    bedrooms: 0,
    bathrooms: 0,
    area: 500,
    city: "Cidade E2E",
    neighborhood: "Bairro Rascunho",
    address: "Rua dos Testes, 400",
    status: "DRAFT" as const,
    parkingSpaces: 0,
    amenities: [],
    images: ["/uploads/e2e/rascunho-1.svg"]
  },
  {
    title: "Studio E2E alugado",
    description: "Imóvel de teste com status alugado, usado para validar o aviso correspondente.",
    price: 1800,
    type: PropertyType.APARTMENT,
    transactionType: TransactionType.RENT,
    bedrooms: 1,
    bathrooms: 1,
    area: 30,
    city: "Cidade E2E",
    neighborhood: "Bairro Alugado",
    address: "Rua dos Testes, 500",
    status: "RENTED" as const,
    parkingSpaces: 0,
    amenities: [],
    images: ["/uploads/e2e/alugado-1.svg"]
  }
];

// PAGE_SIZE da listagem pública é 12 (lib/properties.ts) — com só 1 imóvel disponível
// (acima) não há como testar paginação/ordenação. Estes 15 preenchem a 2ª página.
const PAGINATION_PROPERTY_COUNT = 15;
const paginationProperties = Array.from({ length: PAGINATION_PROPERTY_COUNT }, (_, index) => {
  const n = index + 1;
  return {
    title: `Imóvel E2E Paginação ${n}`,
    description: `Imóvel de teste nº ${n} usado só para encher a listagem e exercitar paginação/ordenação.`,
    // Preço cresce com "n": dá para testar ordenação e faixa de preço de forma previsível.
    price: 200000 + n * 10000,
    type: PropertyType.APARTMENT,
    transactionType: TransactionType.SALE,
    // Varia quartos (1-3) e vagas (0-2) em ciclo, para dar o que filtrar.
    bedrooms: 1 + (n % 3),
    bathrooms: 1,
    area: 50 + n,
    city: "Cidade Paginação",
    neighborhood: "Bairro Paginação",
    address: `Rua da Paginação, ${n}`,
    parkingSpaces: n % 3,
    amenities: [],
    images: ["/uploads/e2e/paginacao.svg"]
  };
});

// Trava de segurança: este script apaga todo o conteúdo do banco (deleteMany geral).
// Só roda contra um DATABASE_URL que claramente aponta para o banco de testes — nunca
// contra dev/produção, mesmo que alguém execute "tsx prisma/seed-e2e.ts" sem passar pelo
// wrapper scripts/e2e-db-setup.ts.
function assertTestDatabase() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/\/(\w*test\w*)(\?|$)/i.test(url)) {
    throw new Error(
      `Recusando rodar: DATABASE_URL ("${url}") não parece ser um banco de testes (esperado algo como ".../imobiliaria_test"). ` +
        "Use npm run test:e2e:db:setup, que define o DATABASE_URL correto."
    );
  }
}

async function main() {
  assertTestDatabase();

  await prisma.lead.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.visitSlotRule.deleteMany();
  await prisma.propertyAlert.deleteMany();
  await prisma.portalListing.deleteMany();
  await prisma.portalCredential.deleteMany();
  await prisma.property.deleteMany();
  await prisma.financingSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Property"', 'code'), 1000)`;

  await prisma.user.create({
    data: {
      name: "Admin E2E",
      email: E2E_ADMIN.email,
      passwordHash: hashPassword(E2E_ADMIN.password),
      role: "ADMIN"
    }
  });

  await prisma.user.create({
    data: {
      name: "Corretor E2E",
      email: E2E_CORRETOR.email,
      passwordHash: hashPassword(E2E_CORRETOR.password),
      role: "CORRETOR"
    }
  });

  await prisma.user.create({
    data: {
      name: "Inativo E2E",
      email: E2E_INACTIVE.email,
      passwordHash: hashPassword(E2E_INACTIVE.password),
      role: "CORRETOR",
      active: false
    }
  });

  // Nunca logou (senha provisória): serve de 2º corretor para testar isolamento de
  // leads/visitas entre contas (ver e2e/admin/leads.spec.ts).
  await prisma.user.create({
    data: {
      name: "Novo Corretor E2E",
      email: E2E_NOVO_CORRETOR.email,
      passwordHash: hashPassword(E2E_NOVO_CORRETOR.password),
      role: "CORRETOR",
      mustChangePassword: true
    }
  });

  for (const property of properties) {
    await prisma.property.create({ data: property });
  }
  await prisma.property.createMany({ data: paginationProperties });

  // Disponibilidade ampla (06h-22h, todo dia da semana) para o agendamento de visita não
  // depender do dia/hora em que a suíte é executada.
  await prisma.visitSlotRule.createMany({
    data: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      startTime: "06:00",
      endTime: "22:00",
      slotMinutes: 60
    }))
  });

  // Liga todos os módulos adicionais: a suíte E2E existe para exercitar o produto inteiro,
  // não para espelhar a configuração comercial de um cliente específico (essa é a função
  // de prisma/seed.ts, que liga só "corretores" e "indicadores").
  for (const moduleId of ADDON_MODULE_IDS) {
    await prisma.moduleFlag.upsert({
      where: { moduleId },
      create: { moduleId, enabled: true },
      update: { enabled: true }
    });
  }

  console.log(`Seed E2E concluído: ${properties.length + paginationProperties.length} imóveis, 4 usuários, ${ADDON_MODULE_IDS.length} módulos ligados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
