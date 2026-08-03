"use server";

import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000; // 1 minuto
const GENERIC_RESET_MESSAGE =
  "Se este e-mail estiver cadastrado, enviamos um link de redefinição de senha.";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou senha inválidos." };
    }
    throw error;
  }
}

export type ChangePasswordState = {
  error?: string;
};

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Não autenticado." };
  }

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < 10) {
    return { error: "A nova senha deve ter ao menos 10 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  await signOut({ redirectTo: "/login" });
  return {};
}

export type RequestPasswordResetState = {
  message?: string;
  error?: string;
};

export async function requestPasswordResetAction(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  const recentToken = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESET_REQUEST_COOLDOWN_MS) } },
  });
  if (recentToken) {
    return { message: GENERIC_RESET_MESSAGE };
  }

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/redefinir-senha?token=${rawToken}`;

  await sendPasswordResetEmail({ to: user.email, recipientName: user.name, resetUrl });

  return { message: GENERIC_RESET_MESSAGE };
}

export type ResetPasswordState = {
  error?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "Link inválido." };
  }
  if (password.length < 10) {
    return { error: "A nova senha deve ter ao menos 10 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  redirect("/login");
}
