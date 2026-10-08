import type { TaskStatus } from "@prisma/client";

const STYLES: Record<TaskStatus, string> = {
  PENDENTE: "bg-slate-100 text-slate-700",
  EM_ANDAMENTO: "bg-sky-100 text-sky-800",
  AGUARDANDO_CLIENTE: "bg-amber-100 text-amber-800",
  CONCLUIDA: "bg-emerald-100 text-emerald-800",
  CANCELADA: "bg-slate-100 text-slate-500 line-through",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDENTE: "Pendente",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STYLES[status]}`}>
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
