import { PrismaClient, PropertyType, TransactionType } from "@prisma/client";
import { hashPassword } from "../lib/auth";
import { ADDON_MODULE_IDS } from "../lib/modules/registry";

const prisma = new PrismaClient();

// Módulos adicionais já em produção nascem ligados; os demais, desligados até serem contratados.
const ENABLED_ADDON_MODULES = new Set(["corretores", "indicadores"]);

const properties = [
  {
    title: "Apartamento moderno no centro",
    description: "Apartamento ensolarado com varanda gourmet, acabamento premium e localização estratégica próximo a comércios, escolas e transporte público.",
    price: 650000,
    type: PropertyType.APARTMENT,
    transactionType: TransactionType.SALE,
    bedrooms: 3,
    bathrooms: 2,
    area: 92,
    city: "São Paulo",
    neighborhood: "Moema",
    address: "Av. Ibirapuera, 1200",
    featured: true,
    condoFee: 850,
    iptu: 2400,
    parkingSpaces: 2,
    petFriendly: true,
    amenities: ["pool", "gym", "partyRoom", "elevator", "concierge", "balcony"],
    images: ["/uploads/seed-1/img-1.svg", "/uploads/seed-1/img-2.svg"]
  },
  {
    title: "Casa ampla com jardim",
    description: "Casa térrea perfeita para famílias, com quintal espaçoso, suíte master, escritório e área gourmet integrada à piscina.",
    price: 1250000,
    type: PropertyType.HOUSE,
    transactionType: TransactionType.SALE,
    bedrooms: 4,
    bathrooms: 4,
    area: 260,
    city: "Campinas",
    neighborhood: "Cambuí",
    address: "Rua das Acácias, 45",
    featured: true,
    iptu: 4800,
    parkingSpaces: 4,
    petFriendly: true,
    amenities: ["pool", "barbecue", "gourmetArea", "garden", "solarEnergy"],
    images: ["/uploads/seed-2/img-1.svg", "/uploads/seed-2/img-2.svg"]
  },
  {
    title: "Sala comercial pronta para uso",
    description: "Conjunto comercial em edifício corporativo com recepção, salas de reunião e vagas rotativas. Ideal para escritórios e consultórios.",
    price: 4200,
    type: PropertyType.COMMERCIAL,
    transactionType: TransactionType.RENT,
    bedrooms: 0,
    bathrooms: 2,
    area: 78,
    city: "Curitiba",
    neighborhood: "Batel",
    address: "Rua Vicente Machado, 800",
    featured: false,
    condoFee: 1200,
    iptu: 3600,
    parkingSpaces: 1,
    furnished: true,
    amenities: ["elevator", "concierge", "airConditioning"],
    images: ["/uploads/seed-3/img-1.svg"]
  },
  {
    title: "Terreno em condomínio fechado",
    description: "Lote plano em condomínio de alto padrão com segurança 24h, área verde e excelente infraestrutura de lazer.",
    price: 380000,
    type: PropertyType.LAND,
    transactionType: TransactionType.SALE,
    bedrooms: 0,
    bathrooms: 0,
    area: 450,
    city: "Florianópolis",
    neighborhood: "Jurerê Internacional",
    address: "Alameda dos Ipês, lote 18",
    featured: false,
    condoFee: 450,
    iptu: 1200,
    amenities: ["concierge", "playground", "partyRoom"],
    images: ["/uploads/seed-4/img-1.svg"]
  },
  {
    title: "Apartamento mobiliado para locação",
    description: "Unidade compacta e mobiliada com infraestrutura completa de condomínio, lavanderia coletiva e coworking.",
    price: 3200,
    type: PropertyType.APARTMENT,
    transactionType: TransactionType.RENT,
    bedrooms: 1,
    bathrooms: 1,
    area: 48,
    city: "Rio de Janeiro",
    neighborhood: "Leblon",
    address: "Rua Dias Ferreira, 210",
    featured: true,
    images: ["/uploads/seed-5/img-1.svg", "/uploads/seed-5/img-2.svg"]
  }
];

async function main() {
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  // Reinicia a numeração dos códigos para que o primeiro imóvel seja o 1001.
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Property"', 'code'), 1000)`;

  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@primelar.com",
      passwordHash: hashPassword("admin123"),
      role: "ADMIN"
    }
  });

  for (const property of properties) {
    await prisma.property.create({ data: property });
  }

  for (const moduleId of ADDON_MODULE_IDS) {
    await prisma.moduleFlag.upsert({
      where: { moduleId },
      create: { moduleId, enabled: ENABLED_ADDON_MODULES.has(moduleId) },
      update: {}
    });
  }

  console.log(`Seed concluído: ${properties.length} imóveis, 1 usuário e ${ADDON_MODULE_IDS.length} módulos criados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });