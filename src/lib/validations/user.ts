import { z } from "zod";
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT } from "@/lib/validations/password";

const ROLE_VALUES = [
  "ADMIN",
  "GESTOR",
  "OPERADOR",
  "COMPANY_HR",
  "COLLABORATOR",
  "CLIENT",
] as const;

const optionalString = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().optional()
);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT),
  role: z.enum(ROLE_VALUES),
  companyId: optionalString,
  whatsapp: optionalString,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  role: z.enum(ROLE_VALUES),
  companyId: optionalString,
  whatsapp: optionalString,
});
