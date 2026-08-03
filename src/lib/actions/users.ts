"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";

function listPathForActor(role: string): string {
  return role === "COMPANY_HR" ? "/portal-rh/colaboradores" : "/admin/usuarios";
}

export type CreateUserState = {
  error?: string;
};

export async function createUserAction(
  _prevState: CreateUserState,
  formData: FormData
): Promise<CreateUserState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN", "COMPANY_HR"]);
  const isHr = authSession.user.role === "COMPANY_HR";

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    companyId: formData.get("companyId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  if (isHr && !authSession.user.companyId) {
    return { error: "Sua conta não está vinculada a uma empresa." };
  }

  const role = isHr ? "COLLABORATOR" : parsed.data.role;
  const companyId = isHr ? authSession.user.companyId : (parsed.data.companyId ?? null);

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
      role,
      companyId,
    },
  });

  const listPath = listPathForActor(authSession.user.role);
  revalidatePath(listPath);
  redirect(listPath);
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
  const authSession = requireRole(session, ["ADMIN", "COMPANY_HR"]);
  const isHr = authSession.user.role === "COMPANY_HR";

  if (isHr) {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.role !== "COLLABORATOR" || target.companyId !== authSession.user.companyId) {
      return { error: "Sem permissão para editar este usuário." };
    }
  }

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    companyId: formData.get("companyId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const active = formData.get("active") === "on";

  if (!isHr && authSession.user.id === userId && (parsed.data.role !== "ADMIN" || !active)) {
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

  const role = isHr ? "COLLABORATOR" : parsed.data.role;
  const companyId = isHr ? authSession.user.companyId : (parsed.data.companyId ?? null);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role,
      companyId,
      active,
      ...(passwordHash ? { passwordHash } : {}),
    },
  });

  const listPath = listPathForActor(authSession.user.role);
  revalidatePath(listPath);
  redirect(listPath);
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
  const authSession = requireRole(session, ["ADMIN", "COMPANY_HR"]);
  const isHr = authSession.user.role === "COMPANY_HR";

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
        prisma.user.findUnique({ where: { id } }),
      ]);

    if (!user) {
      continue;
    }

    if (isHr && (user.role !== "COLLABORATOR" || user.companyId !== authSession.user.companyId)) {
      blockedNames.push(`${user.name} (sem permissão)`);
      continue;
    }

    const hasRelatedRecords =
      ownedDocs > 0 || uploadedDocs > 0 || signatures > 0 || vacationsAsCollaborator > 0 || vacationsAsReviewer > 0;

    if (hasRelatedRecords) {
      blockedNames.push(user.name);
      continue;
    }

    await prisma.user.delete({ where: { id } });
    deletedCount++;
  }

  const listPath = listPathForActor(authSession.user.role);
  revalidatePath(listPath);

  if (blockedNames.length > 0) {
    return {
      error: `Não foi possível excluir ${blockedNames.join(", ")}: possuem documentos ou registros vinculados, ou você não tem permissão sobre eles. Desative o acesso em vez de excluir.`,
      ...(deletedCount > 0 ? { success: `${deletedCount} usuário(s) excluído(s).` } : {}),
    };
  }

  return { success: `${deletedCount} usuário(s) excluído(s).` };
}
