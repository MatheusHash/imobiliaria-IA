import { Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";

export const MIN_PASSWORD_LENGTH = 8;

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  CORRETOR: "Corretor"
};

const baseUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || value.replace(/\D/g, "").length >= 10, "Informe o telefone com DDD")
    .transform((value) => value || null),
  creci: z
    .string()
    .trim()
    .toUpperCase()
    .max(30, "CRECI muito longo")
    .refine((value) => !value || /\d/.test(value), "Informe o número do CRECI")
    .transform((value) => value || null),
  // Só aceita fotos enviadas pelo upload de avatar (evita URLs externas arbitrárias).
  photo: z
    .string()
    .trim()
    .refine((value) => !value || /^\/uploads\/corretores\/[\w-]+\.webp$/.test(value), "Foto inválida")
    .transform((value) => value || null),
  role: z.nativeEnum(Role, { errorMap: () => ({ message: "Papel inválido" }) })
});

export const createUserSchema = baseUserSchema.extend({
  password: z.string().min(MIN_PASSWORD_LENGTH, `A senha provisória precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`)
});

export const updateUserSchema = baseUserSchema.extend({
  active: z.boolean(),
  // Vazio = manter a senha atual; preenchido = nova senha provisória.
  password: z
    .string()
    .refine((value) => !value || value.length >= MIN_PASSWORD_LENGTH, `A senha provisória precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`)
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual"),
    newPassword: z.string().min(MIN_PASSWORD_LENGTH, `A nova senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem"
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "A nova senha precisa ser diferente da atual"
  });

/**
 * Impede alterações que deixariam o sistema sem nenhum administrador ativo
 * (ex.: rebaixar ou desativar o último admin). Retorna a mensagem de erro, ou null.
 */
export async function checkAdminRemains(userId: string, next: { role: Role; active: boolean }) {
  const current = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, active: true } });
  const wasActiveAdmin = current?.role === "ADMIN" && current.active;
  const staysActiveAdmin = next.role === "ADMIN" && next.active;

  if (!wasActiveAdmin || staysActiveAdmin) return null;

  const otherAdmins = await prisma.user.count({ where: { role: "ADMIN", active: true, id: { not: userId } } });
  return otherAdmins > 0 ? null : "O sistema precisa de pelo menos um administrador ativo.";
}

export function isUniqueEmailError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
