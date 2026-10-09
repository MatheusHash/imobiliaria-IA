// Geocodificação via Nominatim (OpenStreetMap) — sem custo, sem chave de API
// (ver docs/modulos.md, módulo 11 e pergunta 5.7: fornecedor de mapas ainda em
// aberto; este é o padrão escolhido para não bloquear a implementação). Uso
// respeitoso da política da Nominatim: só sob ação explícita do admin, nunca
// em lote ou automático, com um User-Agent identificando o produto.

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "ChrodarGestaoImobiliaria/1.0 (geocodificacao via painel administrativo)";

export type GeocodeResult = { latitude: number; longitude: number };

export function buildNominatimUrl(query: string) {
  const params = new URLSearchParams({ format: "json", q: query, limit: "1", countrycodes: "br" });
  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`;
}

export function parseNominatimResponse(data: unknown): GeocodeResult | null {
  if (!Array.isArray(data) || data.length === 0) return null;

  const first = data[0] as { lat?: unknown; lon?: unknown };
  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  const response = await fetch(buildNominatimUrl(query), { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;

  const data = await response.json();
  return parseNominatimResponse(data);
}
