import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === null || value === "" ? undefined : value),
  z.string().trim().optional()
);

/**
 * Campo numérico opcional vindo de `FormData`.
 *
 * O cuidado com o ausente não é cosmético: `Number(undefined)` é `NaN`, e NaN
 * atravessa `.optional()` como se fosse um valor informado. Um contrato
 * semanal sem dia da semana passaria a validação e cairia no padrão silencioso
 * do gerador (segunda-feira). Valor não numérico é devolvido cru para o Zod
 * emitir "esperado número" em vez de aceitar NaN.
 */
const optionalInt = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}, z.number().int().optional());

export const departmentSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do departamento.").max(80),
  color: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida. Use o formato #rrggbb.")
      .optional()
  ),
});

/** Vínculo de uma pessoa com o departamento, como vem do formulário. */
export const membershipSchema = z.enum(["none", "member", "manager"]);

const checklistItemSchema = z.object({
  text: z.string().trim().min(1, "Item do checklist não pode ser vazio.").max(300),
  required: z.boolean(),
});

/**
 * O editor de checklist é um componente de cliente e envia as linhas como um
 * único campo JSON — evita o problema clássico de checkbox desmarcada não
 * aparecer no `FormData` e desalinhar os índices dos arrays paralelos.
 */
export const checklistSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value === "") return [];
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}, z.array(checklistItemSchema).max(50, "No máximo 50 itens no checklist."));

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do serviço.").max(120),
  departmentId: z.string().min(1, "Selecione o departamento."),
  nature: z.enum(["RECORRENTE", "SOB_DEMANDA"]),
  scope: z.enum(["EMPRESA", "CONTA_BANCARIA", "COLABORADOR"]),
  estimatedMinutes: optionalInt.refine(
    (value) => value === undefined || (value > 0 && value <= 60 * 24),
    "Estimativa deve estar entre 1 e 1440 minutos."
  ),
  description: optionalString,
  checklist: checklistSchema,
});

const recurrenceTypeSchema = z.enum([
  "DIARIA",
  "SEMANAL",
  "QUINZENAL",
  "MENSAL",
  "TRIMESTRAL",
  "ANUAL",
]);

export const serviceContractSchema = z
  .object({
    serviceId: z.string().min(1, "Selecione o serviço."),
    bankAccountId: optionalString,
    recurrenceType: recurrenceTypeSchema,
    dayOfMonth: optionalInt.refine(
      (value) => value === undefined || (value >= 1 && value <= 31),
      "Dia do mês deve estar entre 1 e 31."
    ),
    weekday: optionalInt.refine(
      (value) => value === undefined || (value >= 0 && value <= 6),
      "Dia da semana inválido."
    ),
    months: z.preprocess((value) => {
      const raw = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
      return raw.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n <= 12);
    }, z.array(z.number())),
    deadlineTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido. Use HH:mm."),
    adjustment: z.enum(["ANTECIPAR", "POSTERGAR", "MANTER"]),
    targetOffsetDays: z.preprocess((value) => {
      if (value === null || value === undefined || value === "") return 1;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }, z.number().int().min(0, "Não pode ser negativo.").max(30, "No máximo 30 dias.")),
    assigneeId: optionalString,
    startsOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida."),
    endsOn: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de fim inválida.").optional()
    ),
  })
  .refine(
    (data) =>
      !["SEMANAL", "QUINZENAL"].includes(data.recurrenceType) || data.weekday !== undefined,
    { message: "Selecione o dia da semana.", path: ["weekday"] }
  )
  .refine(
    (data) =>
      !["MENSAL", "TRIMESTRAL", "ANUAL"].includes(data.recurrenceType) ||
      data.dayOfMonth !== undefined,
    { message: "Informe o dia do mês.", path: ["dayOfMonth"] }
  )
  .refine(
    (data) =>
      !["TRIMESTRAL", "ANUAL"].includes(data.recurrenceType) || data.months.length > 0,
    { message: "Selecione ao menos um mês.", path: ["months"] }
  )
  .refine((data) => !data.endsOn || data.endsOn >= data.startsOn, {
    message: "O fim da vigência não pode ser antes do início.",
    path: ["endsOn"],
  });
