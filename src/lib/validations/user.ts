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

const optionalDate = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .optional()
);

/** Aceita com ou sem máscara; guardamos como digitado. */
const optionalCpf = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length === 11, "CPF deve ter 11 dígitos.")
    .optional()
);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  password: z.string().min(MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT),
  role: z.enum(ROLE_VALUES),
  companyId: optionalString,
  whatsapp: optionalString,
  cpf: optionalCpf,
  admissionDate: optionalDate,
  birthDate: optionalDate,
});



export const updateUserSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome.").max(200),
  email: z.string().trim().email("Email inválido."),
  role: z.enum(ROLE_VALUES),
  companyId: optionalString,
  whatsapp: optionalString,
  cpf: optionalCpf,
  admissionDate: optionalDate,
  birthDate: optionalDate,
});
