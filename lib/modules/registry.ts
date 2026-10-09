/**
 * Registro central dos módulos do produto (ver docs/modulos.md, seção 2.3).
 * É metadado do produto — igual para toda instalação — por isso vive em código,
 * não no banco. O que varia por cliente é só o `ModuleFlag.enabled` de cada
 * módulo "addon" (ver lib/modules.ts).
 */
export type ModuleId =
  // Pacote Essencial — sempre ligados, não têm linha em ModuleFlag.
  | "vitrine"
  | "pagina-imovel"
  | "gestao-imoveis"
  | "leads"
  // Módulos adicionais já existentes
  | "corretores"
  | "indicadores"
  // Módulos adicionais a implementar
  | "visitas"
  | "portais"
  | "financiamento"
  | "alertas"
  | "mapa";

export type ModuleTier = "essential" | "addon";

export type ModuleDefinition = {
  id: ModuleId;
  name: string;
  tier: ModuleTier;
  /** Módulos de que este depende. Dependências essenciais estão sempre satisfeitas. */
  dependsOn: ModuleId[];
  description: string;
};

export const MODULE_REGISTRY: Record<ModuleId, ModuleDefinition> = {
  vitrine: {
    id: "vitrine",
    name: "Site com vitrine de imóveis",
    tier: "essential",
    dependsOn: [],
    description: "Busca por tipo, preço, quartos, vagas e bairro, com ordenação e paginação."
  },
  "pagina-imovel": {
    id: "pagina-imovel",
    name: "Página completa do imóvel",
    tier: "essential",
    dependsOn: ["vitrine"],
    description: "Galeria, condomínio e IPTU, comodidades, código curto e prévia no WhatsApp."
  },
  "gestao-imoveis": {
    id: "gestao-imoveis",
    name: "Gestão de imóveis",
    tier: "essential",
    dependsOn: [],
    description: "Cadastro com status, fotos otimizadas e duplicação de anúncios."
  },
  leads: {
    id: "leads",
    name: "Leads e WhatsApp",
    tier: "essential",
    dependsOn: ["pagina-imovel"],
    description: "Formulário \"Tenho interesse\", caixa de leads e botão de WhatsApp."
  },
  corretores: {
    id: "corretores",
    name: "Equipe de corretores",
    tier: "addon",
    dependsOn: ["leads"],
    description: "Vários acessos com foto e CRECI; admin vê tudo, corretor vê os próprios leads."
  },
  indicadores: {
    id: "indicadores",
    name: "Painel de indicadores",
    tier: "addon",
    dependsOn: ["leads", "gestao-imoveis"],
    description: "Imóveis por status, leads novos da semana e imóveis mais vistos."
  },
  visitas: {
    id: "visitas",
    name: "Agendamento de visitas",
    tier: "addon",
    dependsOn: ["pagina-imovel"],
    description: "O cliente escolhe o horário da visita direto no site."
  },
  portais: {
    id: "portais",
    name: "Integração com portais",
    tier: "addon",
    dependsOn: ["gestao-imoveis"],
    description: "Envio dos anúncios para ZAP, VivaReal e OLX sem redigitar."
  },
  financiamento: {
    id: "financiamento",
    name: "Simulador de financiamento",
    tier: "addon",
    dependsOn: ["pagina-imovel"],
    description: "Simulação nas tabelas SAC e Price na página do imóvel."
  },
  alertas: {
    id: "alertas",
    name: "Alerta de novos imóveis",
    tier: "addon",
    dependsOn: ["vitrine"],
    description: "O cliente diz o que procura e é avisado quando surgir um imóvel assim."
  },
  mapa: {
    id: "mapa",
    name: "Mapa do imóvel",
    tier: "addon",
    dependsOn: ["pagina-imovel"],
    description: "Localização no mapa na página de cada imóvel."
  }
};

export const ADDON_MODULE_IDS = (Object.values(MODULE_REGISTRY) as ModuleDefinition[])
  .filter((module) => module.tier === "addon")
  .map((module) => module.id);
