"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createId } from "@/lib/id";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { documentPathForRole } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { readStoredFile, saveFile } from "@/lib/storage";
import { sendDocumentUploadedEmail } from "@/lib/email";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, uploadDocumentSchema } from "@/lib/validations/document";
import { parseSignatureImage } from "@/lib/validations/signature";

export type UploadDocumentState = {
  error?: string;
};

export async function uploadDocumentAction(
  _prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN", "COMPANY_HR"]);
  const isHr = authSession.user.role === "COMPANY_HR";

  const parsed = uploadDocumentSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    ownerUserId: formData.get("ownerUserId"),
    referenceMonth: formData.get("referenceMonth"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { error: "Tipo de arquivo não permitido. Use PDF, DOC(X), PNG ou JPG." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo maior que 15MB." };
  }

  const owner = await prisma.user.findUnique({ where: { id: parsed.data.ownerUserId } });
  if (!owner) {
    return { error: "Destinatário não encontrado." };
  }

  if (isHr && (owner.role !== "COLLABORATOR" || owner.companyId !== authSession.user.companyId)) {
    return { error: "Você só pode enviar documentos para colaboradores da sua empresa." };
  }

  const id = createId();
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await saveFile(buffer, file.name, id);

  await prisma.document.create({
    data: {
      id,
      title: parsed.data.title,
      type: parsed.data.type,
      referenceMonth: parsed.data.referenceMonth ?? null,
      ownerUserId: owner.id,
      uploadedByUserId: authSession.user.id,
      filePath,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    },
  });

  const appUrl = process.env.APP_URL;
  const documentPath = documentPathForRole(owner.role, id);
  await sendDocumentUploadedEmail({
    to: owner.email,
    recipientName: owner.name,
    documentTitle: parsed.data.title,
    documentUrl: appUrl && documentPath ? `${appUrl}${documentPath}` : undefined,
    attachment: { filename: file.name, content: buffer, contentType: file.type },
  });

  const requestedRedirect = formData.get("redirectTo");
  const defaultListPath = isHr ? "/portal-rh/documentos" : "/admin/documentos";
  const listPath =
    typeof requestedRedirect === "string" &&
    (requestedRedirect.startsWith("/admin/") || requestedRedirect.startsWith("/portal-rh/"))
      ? requestedRedirect
      : defaultListPath;
  revalidatePath(listPath);
  redirect(listPath);
}

export type ResendDocumentEmailState = {
  error?: string;
  success?: string;
};

/**
 * Re-sends the upload notification, with the stored file attached again. Used
 * after fixing a recipient's address, so the document does not have to be
 * uploaded a second time.
 */
export async function resendDocumentEmailAction(
  _prevState: ResendDocumentEmailState,
  formData: FormData
): Promise<ResendDocumentEmailState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const documentId = String(formData.get("documentId") ?? "");
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { owner: true },
  });

  if (!document) {
    return { error: "Documento não encontrado." };
  }

  let buffer: Buffer;
  try {
    buffer = await readStoredFile(document.filePath);
  } catch {
    return { error: "Não foi possível ler o arquivo armazenado." };
  }

  const appUrl = process.env.APP_URL;
  const documentPath = documentPathForRole(document.owner.role, document.id);

  const result = await sendDocumentUploadedEmail({
    to: document.owner.email,
    recipientName: document.owner.name,
    documentTitle: document.title,
    documentUrl: appUrl && documentPath ? `${appUrl}${documentPath}` : undefined,
    attachment: {
      filename: document.fileName,
      content: buffer,
      contentType: document.mimeType,
    },
  });

  if (!result.ok) {
    return { error: `Falha ao reenviar: ${result.error}` };
  }

  return { success: `E-mail reenviado para ${document.owner.email}.` };
}

export type SignDocumentState = {
  error?: string;
};


export async function signDocumentAction(
  _prevState: SignDocumentState,
  formData: FormData
): Promise<SignDocumentState> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Não autenticado." };
  }

  const documentId = String(formData.get("documentId") ?? "");
  const document = await prisma.document.findUnique({ where: { id: documentId } });

  if (!document || document.ownerUserId !== session.user.id) {
    return { error: "Documento não encontrado." };
  }

  if (document.status !== "PENDING_SIGNATURE") {
    return { error: "Este documento não está pendente de assinatura." };
  }

  const imageData = parseSignatureImage(formData.get("signatureImage"));
  if (!imageData) {
    return { error: "Desenhe sua assinatura manuscrita para concluir." };
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "desconhecido";
  const userAgent = headerList.get("user-agent") ?? "desconhecido";

  const basePath =
    session.user.role === "COLLABORATOR" ? "/portal-colaborador" : "/portal-cliente";

  await prisma.$transaction([
    prisma.signature.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        signerName: session.user.name ?? session.user.email ?? "Usuário",
        ipAddress,
        userAgent,
        imageData,
      },
    }),
    prisma.document.update({
      where: { id: document.id },
      data: { status: "SIGNED" },
    }),
  ]);

  revalidatePath(`${basePath}/documentos/${document.id}`);
  revalidatePath(`${basePath}/documentos`);
  if (basePath === "/portal-colaborador") {
    revalidatePath(basePath);
  }
  revalidatePath(`/admin/documentos/${document.id}`);
  revalidatePath(`/portal-rh/documentos/${document.id}`);
  return {};
}
