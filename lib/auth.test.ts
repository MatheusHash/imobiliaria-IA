import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from "./auth";

describe("hashPassword / verifyPassword", () => {
  it("verifica a senha correta contra o hash gerado", () => {
    const hash = hashPassword("minha-senha-123");
    expect(verifyPassword("minha-senha-123", hash)).toBe(true);
  });

  it("rejeita uma senha errada", () => {
    const hash = hashPassword("minha-senha-123");
    expect(verifyPassword("senha-errada", hash)).toBe(false);
  });

  it("gera um salt diferente a cada chamada (hashes diferentes para a mesma senha)", () => {
    expect(hashPassword("repetida")).not.toBe(hashPassword("repetida"));
  });

  it("não lança e retorna false para um hash malformado", () => {
    expect(verifyPassword("qualquer", "formato-invalido")).toBe(false);
    expect(verifyPassword("qualquer", "")).toBe(false);
    expect(verifyPassword("qualquer", "pbkdf2_sha256$abc$salt$hash")).toBe(false);
  });
});

describe("createSessionToken / verifySessionToken", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("verifica um token recém-criado e devolve o payload", () => {
    const token = createSessionToken({ id: "user-1", email: "user@example.com" });
    const payload = verifySessionToken(token);

    expect(payload?.userId).toBe("user-1");
    expect(payload?.email).toBe("user@example.com");
  });

  it("rejeita token vazio ou nulo", () => {
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });

  it("rejeita token sem o formato payload.assinatura", () => {
    expect(verifySessionToken("token-sem-ponto")).toBeNull();
  });

  it("rejeita token com a assinatura adulterada", () => {
    const token = createSessionToken({ id: "user-1", email: "user@example.com" });
    const [payload, signature] = token.split(".");
    const tamperedSignature = signature.slice(0, -1) + (signature.at(-1) === "A" ? "B" : "A");

    expect(verifySessionToken(`${payload}.${tamperedSignature}`)).toBeNull();
  });

  it("rejeita token com o payload adulterado (assinatura não bate mais)", () => {
    const tokenA = createSessionToken({ id: "user-a", email: "a@example.com" });
    const tokenB = createSessionToken({ id: "user-b", email: "b@example.com" });
    const [, signatureA] = tokenA.split(".");
    const [payloadB] = tokenB.split(".");

    // Payload de B com a assinatura de A: a assinatura não corresponde a esse payload.
    expect(verifySessionToken(`${payloadB}.${signatureA}`)).toBeNull();
  });

  it("rejeita token expirado", () => {
    const token = createSessionToken({ id: "user-1", email: "user@example.com" });

    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000); // 8 dias no futuro (sessão dura 7)

    expect(verifySessionToken(token)).toBeNull();
  });
});
