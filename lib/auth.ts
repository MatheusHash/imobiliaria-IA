import type { Role } from "@prisma/client";
import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const SESSION_COOKIE = "imobiliaria_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 120_000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

type SessionPayload = {
  userId: string;
  email: string;
  exp: number;
};

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

const authUserSelect = { id: true, name: true, email: true, role: true, mustChangePassword: true, active: true } as const;

const INSECURE_SECRETS = new Set(["change-me-in-production", "dev-secret-change-me-before-production"]);

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (process.env.NODE_ENV === "production" && (!secret || INSECURE_SECRETS.has(secret))) {
    throw new Error("AUTH_SECRET precisa ser definido com um valor aleatório em produção.");
  }

  return secret || "dev-secret-change-me-before-production";
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function timingSafeStringEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST).toString("base64url");

  return `pbkdf2_${PASSWORD_DIGEST}$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsText, salt, expectedHash] = storedHash.split("$");
  const digest = algorithm?.replace("pbkdf2_", "");
  const iterations = Number(iterationsText);

  if (!digest || !iterations || !salt || !expectedHash) return false;

  const actualHash = pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, digest).toString("base64url");
  return timingSafeStringEqual(actualHash, expectedHash);
}

export function createSessionToken(user: { id: string; email: string }) {
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !timingSafeStringEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.email || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: { id: string; email: string }) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/"
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Busca o usuário da sessão no banco; sessões de usuários desativados ou excluídos são ignoradas. */
async function findActiveUser(token?: string | null): Promise<AuthUser | null> {
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: authUserSelect });
  if (!user?.active) return null;

  const { active: _active, ...authUser } = user;
  return authUser;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  return findActiveUser(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireCurrentUser(next = "/admin/imoveis") {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (user.mustChangePassword) {
    redirect("/conta?primeiro-acesso=1");
  }

  return user;
}

export async function requireAdmin(next = "/admin/imoveis") {
  const user = await requireCurrentUser(next);

  if (user.role !== "ADMIN") {
    redirect("/admin/imoveis");
  }

  return user;
}

/** Usuário autenticado de uma requisição de API (rotas /api/admin/*), ou null. */
export async function getRequestUser(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];

  const user = await findActiveUser(token);
  return user && !user.mustChangePassword ? user : null;
}
