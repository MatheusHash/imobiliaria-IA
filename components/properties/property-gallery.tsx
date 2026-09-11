"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PropertyGalleryProps = {
  images: string[];
  title: string;
};

function isLocal(src: string) {
  return src.startsWith("/uploads/");
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const validImages = images.length > 0 ? images : ["/uploads/placeholder.svg"];
  const [activeIndex, setActiveIndex] = useState(0);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Navegação por teclado
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  // Se só tem uma imagem, não mostra miniaturas nem setas
  if (validImages.length === 1) {
    return (
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={validImages[0]}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized={isLocal(validImages[0])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Imagem principal */}
      <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        <div className="relative h-full w-full transition-opacity duration-300">
          <Image
            src={validImages[activeIndex]}
            alt={`${title} — foto ${activeIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority={activeIndex === 0}
            unoptimized={isLocal(validImages[activeIndex])}
          />
        </div>

        {/* Botão anterior */}
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          aria-label="Imagem anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Botão próximo */}
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 opacity-0 shadow-md backdrop-blur transition hover:bg-white group-hover:opacity-100 focus:opacity-100 focus:outline-none"
          aria-label="Próxima imagem"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Indicador numérico */}
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {activeIndex + 1} / {validImages.length}
        </span>
      </div>

      {/* Miniaturas */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        {validImages.map((src, index) => (
          <button
            key={`thumb-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`relative aspect-[4/3] w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none ${
              index === activeIndex
                ? "border-slate-950 opacity-100 shadow-md"
                : "border-transparent opacity-60 hover:opacity-90"
            }`}
            aria-label={`Selecionar foto ${index + 1}`}
          >
            <Image
              src={src}
              alt={`${title} — miniatura ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
              unoptimized={isLocal(src)}
            />
          </button>
        ))}
      </div>
    </div>
  );
}