"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createId } from "@/lib/id";

const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

export type UpdateAvatarState = {
  error?: string;
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados.");
  }
  return createClient(url, serviceRoleKey);
}

export async function updateAvatarAction(
  _prevState: UpdateAvatarState,
  formData: FormData
): Promise<UpdateAvatarState> {
  const session = await auth();
  const authSession = requireSession(session);

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem." };
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return { error: "Tipo de arquivo não permitido. Use PNG, JPG ou WEBP." };
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return { error: "Imagem maior que 5MB." };
  }

  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const path = `${authSession.user.id}-${createId()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { error: "Falha ao enviar a imagem. Tente novamente." };
  }

  const previousUser = await prisma.user.findUnique({
    where: { id: authSession.user.id },
    select: { avatarPath: true },
  });

  await prisma.user.update({
    where: { id: authSession.user.id },
    data: { avatarPath: path },
  });

  if (previousUser?.avatarPath) {
    await supabase.storage.from("avatars").remove([previousUser.avatarPath]);
  }

  revalidatePath("/portal-colaborador/perfil");
  return {};
}
