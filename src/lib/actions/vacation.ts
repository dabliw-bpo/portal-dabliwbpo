"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/authz";
import { createId } from "@/lib/id";
import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations/document";
import { createVacationRequestSchema, reviewVacationRequestSchema } from "@/lib/validations/vacation";

export type VacationFormState = {
  error?: string;
};

export async function createVacationRequestAction(
  _prevState: VacationFormState,
  formData: FormData
): Promise<VacationFormState> {
  const session = await auth();
  const authSession = requireRole(session, ["COLLABORATOR"]);

  const parsed = createVacationRequestSchema.safeParse({
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  await prisma.vacationRequest.create({
    data: {
      collaboratorUserId: authSession.user.id,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/portal-colaborador/ferias");
  redirect("/portal-colaborador/ferias");
}

export async function reviewVacationRequestAction(
  _prevState: VacationFormState,
  formData: FormData
): Promise<VacationFormState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const requestId = String(formData.get("requestId") ?? "");
  const parsed = reviewVacationRequestSchema.safeParse({
    decision: formData.get("decision"),
    reviewNotes: formData.get("reviewNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const vacationRequest = await prisma.vacationRequest.findUnique({ where: { id: requestId } });
  if (!vacationRequest || vacationRequest.status !== "REQUESTED") {
    return { error: "Solicitação não encontrada ou já revisada." };
  }

  if (parsed.data.decision === "REJECT") {
    await prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedByUserId: authSession.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.data.reviewNotes,
      },
    });
    revalidatePath("/admin/ferias");
    revalidatePath("/portal-colaborador/ferias");
    redirect("/admin/ferias");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Anexe o documento do acordo de férias para aprovar." };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { error: "Tipo de arquivo não permitido. Use PDF, DOC(X), PNG ou JPG." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: "Arquivo maior que 15MB." };
  }

  const documentId = createId();
  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = await saveFile(buffer, file.name, documentId);

  await prisma.$transaction([
    prisma.document.create({
      data: {
        id: documentId,
        title: `Acordo de férias — ${formatDateOnly(vacationRequest.startDate)} a ${formatDateOnly(vacationRequest.endDate)}`,
        type: "VACATION_REQUEST",
        ownerUserId: vacationRequest.collaboratorUserId,
        uploadedByUserId: authSession.user.id,
        filePath,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      },
    }),
    prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: "DOCUMENT_GENERATED",
        reviewedByUserId: authSession.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.data.reviewNotes,
        documentId,
      },
    }),
  ]);

  revalidatePath("/admin/ferias");
  revalidatePath("/portal-colaborador/ferias");
  redirect("/admin/ferias");
}
