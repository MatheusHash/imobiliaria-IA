"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";

type PropertyMapProps = { latitude: number; longitude: number; label: string };

// Leaflet referencia `window` assim que o módulo é importado, o que quebra a
// renderização no servidor — por isso o import só acontece dentro do efeito
// (executa só no navegador), nunca no topo do arquivo.
export function PropertyMap({ latitude, longitude, label }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("leaflet").then(({ default: leaflet }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // O ícone padrão do Leaflet referencia imagens por caminho relativo, que não
      // resolve com bundlers (Next/webpack). Aponta direto para o CDN oficial do pacote.
      const markerIcon = leaflet.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      // Zoom limitado a 15: dá a região, não o nível de lote/prédio — localização
      // aproximada por respeito à privacidade de quem mora no imóvel hoje.
      const map = leaflet.map(containerRef.current, { scrollWheelZoom: false }).setView([latitude, longitude], 15);
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18
        })
        .addTo(map);

      leaflet.marker([latitude, longitude], { icon: markerIcon }).addTo(map).bindPopup(label);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className="h-80 w-full overflow-hidden rounded-xl border" />;
}
