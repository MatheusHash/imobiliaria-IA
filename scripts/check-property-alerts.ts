/**
 * Varre os alertas de novos imóveis e envia aviso para quem tem correspondência
 * (ver lib/alerts.ts). O cadastro de imóvel já dispara isso sozinho ao publicar
 * (lib/actions.ts); este script é para quem preferir também uma varredura periódica
 * (ex.: cron diário), como alternativa documentada em docs/modulos.md, módulo 10.
 *
 *   npx tsx scripts/check-property-alerts.ts
 */
import { runAlertSweep } from "../lib/alerts";
import { prisma } from "../lib/prisma";

runAlertSweep()
  .then(({ checked, notified }) => {
    console.log(`Alertas verificados: ${checked}. E-mails enviados: ${notified}.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
