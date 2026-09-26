export const siteConfig = {
  name: "Prime Lar Imobiliária",
  description: "Casas, apartamentos, salas comerciais e terrenos para venda e aluguel.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  /** Número com DDI e DDD, só dígitos. Vazio desativa o botão de WhatsApp. */
  whatsappNumber: (process.env.WHATSAPP_NUMBER ?? "").replace(/\D/g, "")
};
