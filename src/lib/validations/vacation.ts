import { z } from "zod";

export const createVacationRequestSchema = z
  .object({
    startDate: z.string().min(1, "Informe a data de início."),
    endDate: z.string().min(1, "Informe a data de fim."),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
    message: "A data de fim deve ser igual ou depois da data de início.",
    path: ["endDate"],
  });

export const reviewVacationRequestSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewNotes: z.string().trim().max(1000).optional(),
});
