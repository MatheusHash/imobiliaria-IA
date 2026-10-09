"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "./actions";
import { getCurrentUser, hashPassword, requireAdmin, verifyPassword } from "./auth";
import { requireModule } from "./modules";
import { prisma } from "./prisma";
import { changePasswordSchema, checkAdminRemains, createUserSchema, isUniqueEmailError, updateUserSchema } from "./users";

function userFormValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    creci: String(formData.get("creci") ?? ""),
    photo: String(formData.get("photo") ?? ""),
    role: String(formData.get("role") ?? "")
  };
}

const EMAIL_IN_USE: ActionState = {
  success: false,
  message: "Revise os campos do formulário.",
  errors: { email: ["Este e-mail já está cadastrado"] }
};

export async function createUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin("/admin/corretores/novo");
  await requireModule("corretores");

  const values = userFormValues(formData);
  const parsed = createUserSchema.safeParse({ ...values, password: String(formData.get("password") ?? "") });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos do formulário.", errors: parsed.error.flatten().fieldErrors, values };
  }

  const { password, ...data } = parsed.data;

  try {
    await prisma.user.create({
      data: { ...data, passwordHash: hashPassword(password), mustChangePassword: true }
    });
  } catch (error) {
    if (isUniqueEmailError(error)) return { ...EMAIL_IN_USE, values };
    throw error;
  }

  revalidatePath("/admin/corretores");
  redirect("/admin/corretores?created=1");
}

export async function updateUserAction(id: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const currentUser = await requireAdmin(`/admin/corretores/${id}/editar`);
  await requireModule("corretores");

  const values = userFormValues(formData);
  const parsed = updateUserSchema.safeParse({
    ...values,
    active: formData.get("active") === "on",
    password: String(formData.get("password") ?? "")
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos do formulário.", errors: parsed.error.flatten().fieldErrors, values };
  }

  const { password, ...data } = parsed.data;

  if (id === currentUser.id && (data.role !== "ADMIN" || !data.active)) {
    return { success: false, message: "Você não pode rebaixar ou desativar a sua própria conta.", values };
  }

  const adminError = await checkAdminRemains(id, data);
  if (adminError) return { success: false, message: adminError, values };

  try {
    await prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(password ? { passwordHash: hashPassword(password), mustChangePassword: true } : {})
      }
    });
  } catch (error) {
    if (isUniqueEmailError(error)) return { ...EMAIL_IN_USE, values };
    throw error;
  }

  revalidatePath("/admin/corretores");
  return {
    success: true,
    message: password ? "Corretor atualizado. A senha provisória deverá ser trocada no próximo acesso." : "Corretor atualizado."
  };
}

export async function changeOwnPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  // Não usa requireCurrentUser: esta ação é justamente a que libera o usuário com senha provisória.
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/conta");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword")
  });

  if (!parsed.success) {
    return { success: false, message: "Revise os campos do formulário.", errors: parsed.error.flatten().fieldErrors };
  }

  const stored = await prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!stored || !verifyPassword(parsed.data.currentPassword, stored.passwordHash)) {
    return { success: false, message: "Revise os campos do formulário.", errors: { currentPassword: ["Senha atual incorreta"] } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword), mustChangePassword: false }
  });

  if (user.mustChangePassword) redirect("/admin/imoveis");
  return { success: true, message: "Senha alterada com sucesso." };
}
