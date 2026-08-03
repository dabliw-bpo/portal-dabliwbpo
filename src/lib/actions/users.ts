"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

export type CreateUserState = {
  error?: string;
};

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "Já existe um usuário com este email." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export type UpdateUserState = {
  error?: string;
};

export async function updateUserAction(
  userId: string,
  _prevState: UpdateUserState,
  formData: FormData
): Promise<UpdateUserState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const active = formData.get("active") === "on";

  if (authSession.user.id === userId && (parsed.data.role !== "ADMIN" || !active)) {
    return { error: "Você não pode remover seu próprio acesso de administrador." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== userId) {
    return { error: "Já existe um usuário com este email." };
  }

  const newPassword = String(formData.get("password") ?? "");
  if (newPassword && newPassword.length < 10) {
    return { error: "A nova senha deve ter ao menos 10 caracteres." };
  }
  const passwordHash = newPassword ? await bcrypt.hash(newPassword, 10) : undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      active,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export type DeleteUsersState = {
  error?: string;
  success?: string;
};

export async function deleteUsersAction(
  _prevState: DeleteUsersState,
  formData: FormData
): Promise<DeleteUsersState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const ids = formData.getAll("userId").map(String).filter(Boolean);
  if (ids.length === 0) {
    return { error: "Selecione ao menos um usuário." };
  }

  if (ids.includes(authSession.user.id)) {
    return { error: "Você não pode excluir sua própria conta." };
  }

  const blockedNames: string[] = [];
  let deletedCount = 0;

  for (const id of ids) {
    const [ownedDocs, uploadedDocs, signatures, vacationsAsCollaborator, vacationsAsReviewer, user] =
      await Promise.all([
        prisma.document.count({ where: { ownerUserId: id } }),
        prisma.document.count({ where: { uploadedByUserId: id } }),
        prisma.signature.count({ where: { userId: id } }),
        prisma.vacationRequest.count({ where: { collaboratorUserId: id } }),
        prisma.vacationRequest.count({ where: { reviewedByUserId: id } }),
        prisma.user.findUnique({ where: { id }, select: { name: true } }),
      ]);

    const hasRelatedRecords =
      ownedDocs > 0 || uploadedDocs > 0 || signatures > 0 || vacationsAsCollaborator > 0 || vacationsAsReviewer > 0;

    if (hasRelatedRecords) {
      blockedNames.push(user?.name ?? id);
      continue;
    }

    await prisma.user.delete({ where: { id } });
    deletedCount++;
  }

  revalidatePath("/admin/usuarios");

  if (blockedNames.length > 0) {
    return {
      error: `Não foi possível excluir ${blockedNames.join(", ")}: possuem documentos ou registros vinculados. Desative o acesso em vez de excluir.`,
      ...(deletedCount > 0 ? { success: `${deletedCount} usuário(s) excluído(s).` } : {}),
    };
  }

  return { success: `${deletedCount} usuário(s) excluído(s).` };
}
