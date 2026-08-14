"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { receiptSchema } from "@/lib/validations/receipt";
import { buildReceiptPdf } from "@/lib/receipt-pdf";
import { deleteStoredFile, readPublicAsset, saveFile } from "@/lib/storage";
import { sendDocumentUploadedEmail } from "@/lib/email";
import { documentPathForRole } from "@/lib/paths";
import { createId } from "@/lib/id";
import { formatCents } from "@/lib/format";

export type ReceiptFormState = {
  error?: string;
  success?: string;
};

function parseReceipt(formData: FormData) {
  return receiptSchema.safeParse({
    description: formData.get("description"),
    amountCents: formData.get("amount"),
  });
}

export async function createReceiptAction(
  companyId: string,
  collaboratorUserId: string,
  _prevState: ReceiptFormState,
  formData: FormData
): Promise<ReceiptFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseReceipt(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const receipt = await prisma.paymentReceipt.create({
    data: {
      companyId,
      collaboratorUserId,
      description: parsed.data.description,
      amountCents: parsed.data.amountCents,
    },
  });

  revalidatePath(`/admin/empresas/${companyId}/folha/${collaboratorUserId}/recibos`);
  redirect(`/admin/empresas/${companyId}/folha/${collaboratorUserId}/recibos/${receipt.id}`);
}

export async function updateReceiptAction(
  receiptId: string,
  _prevState: ReceiptFormState,
  formData: FormData
): Promise<ReceiptFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseReceipt(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const receipt = await prisma.paymentReceipt.update({
    where: { id: receiptId },
    data: {
      description: parsed.data.description,
      amountCents: parsed.data.amountCents,
    },
  });

  revalidatePath(
    `/admin/empresas/${receipt.companyId}/folha/${receipt.collaboratorUserId}/recibos/${receiptId}`
  );
  return { success: "Recibo atualizado." };
}

/**
 * Congela o recibo num PDF, cria o documento correspondente e manda por e-mail
 * para o colaborador assinar. A partir daqui ele segue exatamente o caminho do
 * holerite: assinatura manuscrita no portal, relatório de auditoria e aviso ao
 * sócio — é ele quem assina, como manda um recibo. Valor e descrição deixam de
 * ser editáveis, porque é este arquivo que foi assinado.
 */
export async function sendReceiptForSignatureAction(
  _prevState: ReceiptFormState,
  formData: FormData
): Promise<ReceiptFormState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const receiptId = String(formData.get("receiptId") ?? "");
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    include: { company: true, collaborator: true },
  });

  if (!receipt) {
    return { error: "Recibo não encontrado." };
  }
  if (receipt.documentId) {
    return { error: "Este recibo já foi enviado para assinatura." };
  }
  let companyLogo: { bytes: Uint8Array; type: "png" | "jpg" } | null = null;
  if (receipt.company.logoPath) {
    try {
      companyLogo = {
        bytes: await readPublicAsset(receipt.company.logoPath),
        type: receipt.company.logoPath.toLowerCase().endsWith(".png") ? "png" : "jpg",
      };
    } catch {
      // sem logo o PDF sai só com o nome
    }
  }

  const pdf = await buildReceiptPdf({
    companyName: receipt.company.name,
    companyCnpj: receipt.company.cnpj,
    companyCity: receipt.company.city,
    companyState: receipt.company.state,
    companyLogo,
    collaboratorName: receipt.collaborator.name,
    collaboratorCpf: receipt.collaborator.cpf,
    description: receipt.description,
    amountCents: receipt.amountCents,
    issuedAt: receipt.issuedAt,
  });

  const documentId = createId();
  const fileName = `recibo-${receipt.issuedAt.toISOString().slice(0, 10)}.pdf`;
  const filePath = await saveFile(pdf, fileName, documentId);
  const title = `Recibo de pagamento - ${formatCents(receipt.amountCents)}`;

  await prisma.$transaction([
    prisma.document.create({
      data: {
        id: documentId,
        title,
        type: "OTHER",
        ownerUserId: receipt.collaboratorUserId,
        uploadedByUserId: authSession.user.id,
        filePath,
        fileName,
        mimeType: "application/pdf",
        fileSize: pdf.byteLength,
      },
    }),
    prisma.paymentReceipt.update({ where: { id: receiptId }, data: { documentId } }),
  ]);

  const appUrl = process.env.APP_URL;
  const documentPath = documentPathForRole(receipt.collaborator.role, documentId);
  const sent = await sendDocumentUploadedEmail({
    to: receipt.collaborator.email,
    recipientName: receipt.collaborator.name,
    documentTitle: title,
    documentUrl: appUrl && documentPath ? `${appUrl}${documentPath}` : undefined,
    attachment: { filename: fileName, content: pdf, contentType: "application/pdf" },
  });

  revalidatePath(
    `/admin/empresas/${receipt.companyId}/folha/${receipt.collaboratorUserId}/recibos/${receiptId}`
  );

  return sent.ok
    ? { success: `Recibo enviado para ${receipt.collaborator.email}.` }
    : {
        error: `Recibo gerado, mas o e-mail falhou: ${sent.error}. Use o botão de reenviar no documento.`,
      };
}

export type DeleteReceiptState = {
  error?: string;
};

/** Exclui um recibo. Assinado, não sai: é a quitação do pagamento. */
export async function deleteReceiptAction(
  _prevState: DeleteReceiptState,
  formData: FormData
): Promise<DeleteReceiptState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const receiptId = String(formData.get("receiptId") ?? "");
  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
    include: { document: { include: { signature: { select: { id: true } } } } },
  });

  if (!receipt) {
    return { error: "Recibo não encontrado." };
  }
  if (receipt.document?.signature) {
    return {
      error: "Este recibo já foi assinado pelo colaborador e não pode ser excluído.",
    };
  }

  const listPath = `/admin/empresas/${receipt.companyId}/folha/${receipt.collaboratorUserId}/recibos`;

  await prisma.$transaction(async (tx) => {
    await tx.paymentReceipt.delete({ where: { id: receiptId } });
    // O PDF enviado só existe por causa do recibo; sem ele, não tem dono.
    if (receipt.documentId) {
      await tx.document.delete({ where: { id: receipt.documentId } });
    }
  });

  if (receipt.document) {
    try {
      await deleteStoredFile(receipt.document.filePath);
    } catch (error) {
      console.error("[recibo] Registro excluído, arquivo permaneceu:", error);
    }
  }

  revalidatePath(listPath);
  redirect(listPath);
}
