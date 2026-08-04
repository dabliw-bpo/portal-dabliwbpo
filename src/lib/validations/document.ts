import { z } from "zod";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
] as const;

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export const documentTypeSchema = z.enum(["CONTRACT", "PAYSLIP", "VACATION_REQUEST", "OTHER"]);

export const uploadDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Informe um título.").max(200),
    type: documentTypeSchema,
    ownerUserId: z.string().min(1, "Selecione um destinatário."),
    referenceMonth: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Competência inválida.")
        .optional()
    ),
  })
  .refine((data) => data.type !== "PAYSLIP" || Boolean(data.referenceMonth), {
    message: "Informe a competência do holerite.",
    path: ["referenceMonth"],
  });
