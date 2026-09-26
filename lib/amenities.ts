// Comodidades que podem ser marcadas no cadastro do imóvel.
// A chave é gravada no banco; o rótulo é o que aparece na tela.
export const amenityLabels = {
  pool: "Piscina",
  barbecue: "Churrasqueira",
  gourmetArea: "Espaço gourmet",
  gym: "Academia",
  playground: "Playground",
  partyRoom: "Salão de festas",
  concierge: "Portaria 24h",
  elevator: "Elevador",
  balcony: "Varanda",
  garden: "Jardim / quintal",
  airConditioning: "Ar-condicionado",
  solarEnergy: "Energia solar"
} as const;

export type Amenity = keyof typeof amenityLabels;

export const amenityKeys = Object.keys(amenityLabels) as Amenity[];

export function isAmenity(value: string): value is Amenity {
  return value in amenityLabels;
}
