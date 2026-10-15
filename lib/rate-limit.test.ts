import { describe, expect, it, vi } from "vitest";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

describe("checkRateLimit", () => {
  it("permite as primeiras `limit` tentativas e bloqueia a seguinte", () => {
    const key = `test-${Math.random()}`;

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
    }
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);
  });

  it("chaves diferentes têm contadores independentes", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;

    for (let i = 0; i < 5; i++) checkRateLimit(keyA, 5, 60_000);

    expect(checkRateLimit(keyA, 5, 60_000).allowed).toBe(false);
    expect(checkRateLimit(keyB, 5, 60_000).allowed).toBe(true);
  });

  it("libera de novo depois que a janela de tempo passa", () => {
    const key = `test-window-${Math.random()}`;

    vi.useFakeTimers();
    try {
      for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 1000);
      expect(checkRateLimit(key, 5, 1000).allowed).toBe(false);

      vi.advanceTimersByTime(1001);

      expect(checkRateLimit(key, 5, 1000).allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("resetRateLimit zera o contador imediatamente", () => {
    const key = `test-reset-${Math.random()}`;

    for (let i = 0; i < 5; i++) checkRateLimit(key, 5, 60_000);
    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(false);

    resetRateLimit(key);

    expect(checkRateLimit(key, 5, 60_000).allowed).toBe(true);
  });
});
