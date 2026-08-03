import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da empresa.").max(200),
  cnpj: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((value) => (value ? value : undefined)),
});
