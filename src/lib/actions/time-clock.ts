"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, saveFile } from "@/lib/storage";
import {
  TIME_CLOCK_MAX_BYTES,
  TIME_CLOCK_MAX_FILES_PER_SEND,
  TIME_CLOCK_MIME_TYPES,
  isFutureMonth,
  isMonthKey,
  sniffMimeType,
} from "@/lib/time-clock";

export type TimeClockState = {
  error?: string;
  success?: string;
};

function revalidateTimeClock(companyId: string, userId: string) {
  revalidatePath("/portal-colaborador/ponto");
  revalidatePath(`/admin/empresas/${companyId}/folha/${userId}/ponto`);
}

/**
 * Envia fotos ou arquivos de ponto de um mês.
 *
 * O colaborador envia só em nome próprio; o admin pode enviar em nome de um
 * colaborador (`collaboratorUserId` no formulário), para o caso de o arquivo ter
 * chegado por outro canal. O que vale é o dono do arquivo, sempre um
 * colaborador de uma empresa.
 */
export async function uploadTimeClockFilesAction(
  _prevState: TimeClockState,
  formData: FormData
): Promise<TimeClockState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Faça login para enviar arquivos." };
  }
  const role = session.user.role;
  if (role !== "COLLABORATOR" && role !== "ADMIN") {
    return { error: "Sem permissão para enviar comprovantes de ponto." };
  }

  const targetId =
    role === "ADMIN" ? String(formData.get("collaboratorUserId") ?? "") : session.user.id;
  if (!targetId) {
    return { error: "Colaborador não informado." };
  }

  const collaborator = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true, active: true, companyId: true },
  });
  if (!collaborator || collaborator.role !== "COLLABORATOR" || !collaborator.companyId) {
    return { error: "Colaborador não encontrado." };
  }
  if (!collaborator.active) {
    return { error: "Este cadastro está inativo." };
  }

  const month = String(formData.get("referenceMonth") ?? "");
  if (!isMonthKey(month)) {
    return { error: "Escolha o mês a que o ponto se refere." };
  }
  if (isFutureMonth(month)) {
    return { error: "O mês escolhido ainda não começou." };
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) {
    return { error: "Selecione ao menos uma foto ou arquivo." };
  }
  if (files.length > TIME_CLOCK_MAX_FILES_PER_SEND) {
    return { error: `Envie até ${TIME_CLOCK_MAX_FILES_PER_SEND} arquivos por vez.` };
  }

  // Valida tudo antes de gravar qualquer coisa: um envio é aceito inteiro ou
  // recusado inteiro, para o colaborador não ficar sem saber o que entrou.
  const prepared: Array<{ file: File; buffer: Buffer; mimeType: string }> = [];
  for (const file of files) {
    if (file.size > TIME_CLOCK_MAX_BYTES) {
      return { error: `"${file.name}" tem mais de 15 MB.` };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffMimeType(buffer);
    if (!sniffed || !(TIME_CLOCK_MIME_TYPES as readonly string[]).includes(sniffed)) {
      return { error: `"${file.name}" não é uma foto ou PDF válido. Use JPG, PNG, WEBP, HEIC ou PDF.` };
    }
    prepared.push({ file, buffer, mimeType: sniffed });
  }

  const saved: string[] = [];
  try {
    for (const item of prepared) {
      const id = createId();
      const filePath = await saveFile(item.buffer, item.file.name, id);
      saved.push(filePath);
      await prisma.timeClockFile.create({
        data: {
          id,
          companyId: collaborator.companyId,
          collaboratorUserId: collaborator.id,
          referenceMonth: month,
          filePath,
          fileName: item.file.name.slice(0, 200),
          mimeType: item.mimeType,
          fileSize: item.buffer.byteLength,
          uploadedByUserId: session.user.id,
        },
      });
    }
  } catch (error) {
    // Não deixa arquivo órfão no armazenamento se o registro falhou.
    await Promise.all(saved.map((path) => deleteStoredFile(path).catch(() => undefined)));
    console.error("[ponto] falha ao salvar envio:", error);
    return { error: "Não foi possível salvar o envio. Tente de novo." };
  }

  revalidateTimeClock(collaborator.companyId, collaborator.id);
  return {
    success:
      prepared.length === 1
        ? "1 arquivo enviado."
        : `${prepared.length} arquivos enviados.`,
  };
}

/**
 * Exclui um arquivo enviado. O admin exclui qualquer um; o colaborador só os
 * que ele mesmo enviou (para desfazer foto errada).
 */
export async function deleteTimeClockFileAction(
  _prevState: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Faça login para excluir." };
  }

  const fileId = String(formData.get("fileId") ?? "");
  const file = await prisma.timeClockFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return { error: "Arquivo não encontrado." };
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwnUpload =
    session.user.role === "COLLABORATOR" &&
    file.collaboratorUserId === session.user.id &&
    file.uploadedByUserId === session.user.id;
  if (!isAdmin && !isOwnUpload) {
    return { error: "Sem permissão para excluir este arquivo." };
  }

  await prisma.timeClockFile.delete({ where: { id: file.id } });
  await deleteStoredFile(file.filePath).catch((error) => {
    console.error("[ponto] arquivo removido do banco, mas não do armazenamento:", error);
  });

  revalidateTimeClock(file.companyId, file.collaboratorUserId);
  return {};
}
