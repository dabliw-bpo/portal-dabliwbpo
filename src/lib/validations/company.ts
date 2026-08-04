import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().max(300).optional()
);

const optionalLongString = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().max(4000).optional()
);

const optionalDate = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .optional()
);

function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.enum(values).optional()
  );
}

export const BRANCH_TYPES = ["MATRIZ", "FILIAL"] as const;

export const COMPANY_SIZES = ["ME", "EPP", "DEMAIS"] as const;

export const REGISTRATION_STATUSES = ["ATIVA", "SUSPENSA", "INAPTA", "BAIXADA", "NULA"] as const;

/** The Cartão CNPJ fields, shared by the "nova empresa" and "cadastro" forms. */
export const companyRegistrationSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome empresarial.").max(200),
  cnpj: optionalString,
  tradeName: optionalString,
  openingDate: optionalDate,
  branchType: optionalEnum(BRANCH_TYPES),
  legalNature: optionalString,
  companySize: optionalEnum(COMPANY_SIZES),
  mainActivity: optionalString,
  secondaryActivities: optionalLongString,

  street: optionalString,
  streetNumber: optionalString,
  complement: optionalString,
  district: optionalString,
  city: optionalString,
  state: optionalString,
  zipCode: optionalString,

  email: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().email("Email inválido.").max(300).optional()
  ),
  phone: optionalString,

  federalEntity: optionalString,
  registrationStatus: optionalEnum(REGISTRATION_STATUSES),
  registrationStatusDate: optionalDate,
  registrationStatusReason: optionalString,
  specialStatus: optionalString,
  specialStatusDate: optionalDate,
});

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(1, "Informe o banco.").max(200),
  bankCode: optionalString,
  agency: z.string().trim().min(1, "Informe a agência.").max(50),
  accountNumber: z.string().trim().min(1, "Informe a conta.").max(50),
  cnpj: optionalString,
  pixKey: optionalString,
});
