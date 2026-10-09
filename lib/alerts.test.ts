import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { confirmAlert, createAlert, describeAlertFilters, getAlertByCancelToken, runAlertSweep, type AlertFilters } from "./alerts";
import { cancelAlert } from "./alerts";
import { emailSender } from "./email";
import { clearModuleCache } from "./modules";
import { prisma } from "./prisma";

describe("describeAlertFilters", () => {
  it("monta um resumo legível", () => {
    expect(describeAlertFilters({ type: "APARTMENT", transactionType: "SALE", city: "São Paulo" })).toBe(
      "Apartamento · Venda · São Paulo"
    );
  });

  it("cai para um texto genérico quando não há filtro nenhum", () => {
    expect(describeAlertFilters({})).toBe("Qualquer imóvel novo");
  });
});

const TEST_EMAIL = "teste-alertas@example.com";

describe("alertas (integração, banco local)", () => {
  beforeEach(async () => {
    await prisma.propertyAlert.deleteMany({ where: { email: TEST_EMAIL } });
  });

  afterEach(async () => {
    await prisma.propertyAlert.deleteMany({ where: { email: TEST_EMAIL } });
    vi.restoreAllMocks();
  });

  it("createAlert cria o registro não confirmado e envia o e-mail de confirmação", async () => {
    const sendSpy = vi.spyOn(emailSender, "send").mockResolvedValue();
    const alert = await createAlert(TEST_EMAIL, { city: "Campinas" });

    expect(alert.confirmed).toBe(false);
    expect(alert.active).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ to: TEST_EMAIL }));
  });

  it("confirmAlert marca como confirmado; token inválido retorna null", async () => {
    vi.spyOn(emailSender, "send").mockResolvedValue();
    const alert = await createAlert(TEST_EMAIL, {});

    expect(await confirmAlert("token-invalido")).toBeNull();
    const confirmed = await confirmAlert(alert.confirmToken);
    expect(confirmed?.confirmed).toBe(true);
  });

  it("cancelAlert desativa o alerta e getAlertByCancelToken continua encontrando (histórico)", async () => {
    vi.spyOn(emailSender, "send").mockResolvedValue();
    const alert = await createAlert(TEST_EMAIL, {});

    const canceled = await cancelAlert(alert.cancelToken);
    expect(canceled?.active).toBe(false);

    const found = await getAlertByCancelToken(alert.cancelToken);
    expect(found?.active).toBe(false);
  });

  it("runAlertSweep avisa só sobre imóveis criados depois do último aviso, e não repete", async () => {
    const sendSpy = vi.spyOn(emailSender, "send").mockResolvedValue();

    // runAlertSweep só trabalha com o módulo ligado; garante isso independente do estado local.
    await prisma.moduleFlag.upsert({ where: { moduleId: "alertas" }, create: { moduleId: "alertas", enabled: true }, update: { enabled: true } });
    clearModuleCache();

    const alert = await createAlert(TEST_EMAIL, { city: "Cidade Teste Alertas" } satisfies AlertFilters);
    await prisma.propertyAlert.update({ where: { id: alert.id }, data: { confirmed: true } });
    sendSpy.mockClear();

    const property = await prisma.property.create({
      data: {
        title: "Imóvel para teste de alerta",
        description: "Descrição de teste",
        price: 100000,
        type: "APARTMENT",
        transactionType: "SALE",
        bedrooms: 1,
        bathrooms: 1,
        area: 10,
        city: "Cidade Teste Alertas",
        neighborhood: "Bairro Teste",
        address: "Rua Teste, 1",
        status: "AVAILABLE",
        images: ["/uploads/seed-1/img-1.svg"]
      }
    });

    const result = await runAlertSweep();
    expect(result.notified).toBe(1);
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy.mock.calls[0][0].to).toBe(TEST_EMAIL);

    sendSpy.mockClear();
    const secondRun = await runAlertSweep();
    expect(secondRun.notified).toBe(0);
    expect(sendSpy).not.toHaveBeenCalled();

    await prisma.property.delete({ where: { id: property.id } });
  });

  it("não faz nada quando o módulo 'alertas' está desligado", async () => {
    const sendSpy = vi.spyOn(emailSender, "send").mockResolvedValue();
    const flag = await prisma.moduleFlag.findUnique({ where: { moduleId: "alertas" } });
    const wasEnabled = flag?.enabled ?? false;

    await prisma.moduleFlag.upsert({ where: { moduleId: "alertas" }, create: { moduleId: "alertas", enabled: false }, update: { enabled: false } });
    clearModuleCache();

    const result = await runAlertSweep();
    expect(result).toEqual({ checked: 0, notified: 0 });
    expect(sendSpy).not.toHaveBeenCalled();

    await prisma.moduleFlag.update({ where: { moduleId: "alertas" }, data: { enabled: wasEnabled } });
    clearModuleCache();
  });
});
