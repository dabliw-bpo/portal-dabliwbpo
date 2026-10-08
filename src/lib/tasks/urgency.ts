import type { TaskStatus } from "@prisma/client";

/**
 * Urgência é derivada, nunca persistida: um campo `ATRASADA` no banco
 * dessincroniza no instante em que o relógio passa da meia-noite.
 */
export type Urgency = "VENCIDA" | "HOJE" | "EM_RISCO" | "ESTA_SEMANA" | "DEPOIS";

export const OPEN_STATUSES = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
] as const satisfies readonly TaskStatus[];

export function isOpen(status: TaskStatus): boolean {
  return (OPEN_STATUSES as readonly TaskStatus[]).includes(status);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function urgencyOf(
  task: { status: TaskStatus; dueDateLegal: Date; dueDateTarget: Date },
  now: Date = new Date()
): Urgency {
  if (!isOpen(task.status)) {
    return "DEPOIS";
  }
  if (now > task.dueDateLegal) {
    return "VENCIDA";
  }
  if (isSameDay(task.dueDateLegal, now)) {
    return "HOJE";
  }
  if (now > task.dueDateTarget) {
    return "EM_RISCO";
  }

  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return task.dueDateLegal <= endOfWeek ? "ESTA_SEMANA" : "DEPOIS";
}

/** Ordem de exibição da fila — do que queima primeiro para o que pode esperar. */
export const URGENCY_ORDER: readonly Urgency[] = [
  "VENCIDA",
  "HOJE",
  "EM_RISCO",
  "ESTA_SEMANA",
  "DEPOIS",
];

export const URGENCY_LABEL: Record<Urgency, string> = {
  VENCIDA: "Vencidas",
  HOJE: "Hoje",
  EM_RISCO: "Em risco",
  ESTA_SEMANA: "Esta semana",
  DEPOIS: "Depois",
};
