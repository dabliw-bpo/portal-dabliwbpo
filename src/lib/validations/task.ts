import type { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const taskStatusSchema = z.enum([
  "PENDENTE",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDA",
  "CANCELADA",
]);

/**
 * Transições permitidas. `CONCLUIDA` não entra aqui como destino: concluir tem
 * regra própria (checklist obrigatório e evidência) e passa por
 * `completeTaskAction`, não pela troca genérica de status.
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  PENDENTE: ["EM_ANDAMENTO", "CANCELADA"],
  EM_ANDAMENTO: ["PENDENTE", "AGUARDANDO_CLIENTE", "CANCELADA"],
  AGUARDANDO_CLIENTE: ["EM_ANDAMENTO", "CANCELADA"],
  // Reabrir é permitido de propósito: erro de conclusão acontece, e forçar o
  // time a criar uma tarefa paralela para corrigir destrói o histórico.
  CONCLUIDA: ["EM_ANDAMENTO"],
  CANCELADA: ["PENDENTE"],
};

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export const changeStatusSchema = z.object({
  taskId: z.string().min(1),
  status: taskStatusSchema,
  note: z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().max(500).optional()
  ),
});

export const toggleChecklistSchema = z.object({
  taskId: z.string().min(1),
  itemId: z.string().min(1),
});

export const attachDocumentSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().trim().min(1, "Informe um título para o documento.").max(200),
});

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    z.string().trim().max(max).optional()
  );

/**
 * Demanda avulsa: o que o cliente pede fora da rotina contratada. Não tem
 * recorrência — só um vencimento, dia e hora de Brasília.
 */
export const createDemandSchema = z.object({
  serviceId: z.string().min(1, "Selecione o serviço."),
  bankAccountId: optionalText(100),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de vencimento."),
  dueTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido. Use HH:mm."),
  origin: z.enum(["SOLICITACAO_CLIENTE", "ORDEM_SERVICO"]),
  assigneeId: optionalText(100),
  note: optionalText(500),
});
