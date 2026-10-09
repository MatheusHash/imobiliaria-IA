import { describe, expect, it } from "vitest";
import { buildNominatimUrl, parseNominatimResponse } from "./geocoding";

describe("buildNominatimUrl", () => {
  it("inclui a query, limita a 1 resultado e restringe ao Brasil", () => {
    const url = buildNominatimUrl("Av. Ibirapuera, 1200, Moema, São Paulo");
    expect(url).toContain("nominatim.openstreetmap.org/search");
    expect(url).toContain("countrycodes=br");
    expect(url).toContain("limit=1");
    expect(url).toContain(encodeURIComponent("Av. Ibirapuera, 1200, Moema, São Paulo").replace(/%20/g, "+"));
  });
});

describe("parseNominatimResponse", () => {
  it("extrai lat/lon do primeiro resultado", () => {
    const result = parseNominatimResponse([{ lat: "-23.5880", lon: "-46.6566" }]);
    expect(result).toEqual({ latitude: -23.588, longitude: -46.6566 });
  });

  it("retorna null para resposta vazia", () => {
    expect(parseNominatimResponse([])).toBeNull();
  });

  it("retorna null quando lat/lon não são números válidos", () => {
    expect(parseNominatimResponse([{ lat: "abc", lon: "def" }])).toBeNull();
  });

  it("retorna null para formato inesperado", () => {
    expect(parseNominatimResponse({ error: "not found" })).toBeNull();
    expect(parseNominatimResponse(null)).toBeNull();
  });
});
