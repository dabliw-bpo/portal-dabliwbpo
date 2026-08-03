import { z } from "zod";

const ROLE_VALUES = ["ADMIN", "COMPANY_HR", "COLLABORATOR", "CLIENT"] as const;

const optionalCompanyId = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().optional()
);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(10, "A senha deve ter ao menos 10 caracteres."),
  role: z.enum(ROLE_VALUES),
  companyId: optionalCompanyId,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  role: z.enum(ROLE_VALUES),
  companyId: optionalCompanyId,
});
