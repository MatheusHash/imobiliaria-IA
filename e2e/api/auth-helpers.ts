import { createSessionToken, SESSION_COOKIE } from "../../lib/auth";

/** Cabeçalho Cookie com uma sessão válida assinada para o usuário dado — sem precisar passar pela UI de login. */
export function sessionCookieHeader(user: { id: string; email: string }) {
  return { Cookie: `${SESSION_COOKIE}=${createSessionToken(user)}` };
}
