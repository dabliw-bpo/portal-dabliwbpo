"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { receiptSchema } from "@/lib/validations/receipt";
import { parseSignatureImage } from "@/lib/validations/signature";

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

export async function saveReceiptSignaturesAction(
  receiptId: string,
  _prevState: ReceiptFormState,
  formData: FormData
): Promise<ReceiptFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const companySignature = parseSignatureImage(formData.get("companySignatureImage"));
  const collaboratorSignature = parseSignatureImage(formData.get("collaboratorSignatureImage"));

  if (!companySignature && !collaboratorSignature) {
    return { error: "Colete ao menos uma assinatura antes de salvar." };
  }

  const receipt = await prisma.paymentReceipt.update({
    where: { id: receiptId },
    data: {
      ...(companySignature ? { companySignatureImage: companySignature } : {}),
      ...(collaboratorSignature ? { collaboratorSignatureImage: collaboratorSignature } : {}),
    },
  });

  revalidatePath(
    `/admin/empresas/${receipt.companyId}/folha/${receipt.collaboratorUserId}/recibos/${receiptId}`
  );
  return { success: "Assinaturas salvas." };
}
