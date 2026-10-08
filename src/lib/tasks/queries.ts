import type { Prisma, TaskStatus } from "@prisma/client";
import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";
import { taskScopeFor } from "./scope";
import { OPEN_STATUSES } from "./urgency";

export type TaskFilters = {
  /** `me` (padrão), `all`, `none` (sem responsável) ou o id de um usuário. */
  assignee: string;
  /** `open` (padrão), `all` ou um `TaskStatus`. */
  status: string;
  companyId: string | null;
  departmentId: string | null;
  serviceId: string | null;
};

export const DEFAULT_FILTERS: TaskFilters = {
  assignee: "me",
  status: "open",
  companyId: null,
  departmentId: null,
  serviceId: null,
};

const STATUS_VALUES: readonly string[] = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "CONCLUIDA",
  "CANCELADA",
];

function first(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** A fila abre em "minhas, não concluídas" quando não há nada na query string. */
export function parseFilters(params: Record<string, string | string[] | undefined>): TaskFilters {
  return {
    assignee: first(params.responsavel) ?? DEFAULT_FILTERS.assignee,
    status: first(params.status) ?? DEFAULT_FILTERS.status,
    companyId: first(params.cliente),
    departmentId: first(params.departamento),
    serviceId: first(params.servico),
  };
}

function statusCondition(status: string): Prisma.TaskWhereInput {
  if (status === "all") return {};
  if (STATUS_VALUES.includes(status)) return { status: status as TaskStatus };
  return { status: { in: [...OPEN_STATUSES] } };
}

function assigneeCondition(assignee: string, currentUserId: string): Prisma.TaskWhereInput {
  if (assignee === "all") return {};
  if (assignee === "none") return { assigneeId: null };
  if (assignee === "me") return { assigneeId: currentUserId };
  return { assigneeId: assignee };
}

export type QueueTask = Prisma.TaskGetPayload<{
  include: {
    company: { select: { id: true; name: true; tradeName: true } };
    service: { select: { id: true; name: true } };
    department: { select: { id: true; name: true; color: true } };
    bankAccount: { select: { id: true; bankName: true; agency: true; accountNumber: true } };
    assignee: { select: { id: true; name: true } };
    contract: { select: { recurrenceType: true } };
    checklist: { select: { id: true; required: true; checkedAt: true } };
  };
}>;

export type FilterOption = { id: string; name: string };

export type QueueOptions = {
  companies: FilterOption[];
  departments: FilterOption[];
  services: FilterOption[];
  assignees: FilterOption[];
};

/**
 * Carrega a fila já recortada pelo papel e pelos filtros da tela.
 *
 * O recorte de papel entra como primeiro termo do `AND`, então nenhum filtro
 * vindo da query string consegue ampliá-lo.
 */
export async function listQueueTasks(
  session: Session,
  filters: TaskFilters
): Promise<{ tasks: QueueTask[]; options: QueueOptions }> {
  const scope = await taskScopeFor(session);

  const where: Prisma.TaskWhereInput = {
    AND: [
      scope,
      statusCondition(filters.status),
      assigneeCondition(filters.assignee, session.user.id),
      filters.companyId ? { companyId: filters.companyId } : {},
      filters.departmentId ? { departmentId: filters.departmentId } : {},
      filters.serviceId ? { serviceId: filters.serviceId } : {},
    ],
  };

  const [tasks, scoped] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ dueDateLegal: "asc" }, { id: "asc" }],
      include: {
        company: { select: { id: true, name: true, tradeName: true } },
        service: { select: { id: true, name: true } },
        department: { select: { id: true, name: true, color: true } },
        bankAccount: { select: { id: true, bankName: true, agency: true, accountNumber: true } },
        assignee: { select: { id: true, name: true } },
        contract: { select: { recurrenceType: true } },
        checklist: { select: { id: true, required: true, checkedAt: true } },
      },
    }),
    // As opções dos filtros saem do que o usuário já pode enxergar — assim um
    // operador não descobre a carteira inteira pelo dropdown. Varre o escopo
    // inteiro, o que é aceitável no volume atual e é o primeiro ponto a
    // otimizar (groupBy) quando a base crescer.
    prisma.task.findMany({
      where: scope,
      select: {
        companyId: true,
        company: { select: { name: true } },
        departmentId: true,
        department: { select: { name: true } },
        serviceId: true,
        service: { select: { name: true } },
        assigneeId: true,
        assignee: { select: { name: true } },
      },
    }),
  ]);

  const dedupe = (entries: Array<[string | null, string | null | undefined]>): FilterOption[] => {
    const map = new Map<string, string>();
    for (const [id, name] of entries) {
      if (id && name) map.set(id, name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  };

  return {
    tasks,
    options: {
      companies: dedupe(scoped.map((t) => [t.companyId, t.company?.name])),
      departments: dedupe(scoped.map((t) => [t.departmentId, t.department?.name])),
      services: dedupe(scoped.map((t) => [t.serviceId, t.service?.name])),
      assignees: dedupe(scoped.map((t) => [t.assigneeId, t.assignee?.name])),
    },
  };
}

/** Descreve o escopo da atividade: a conta bancária, quando houver. */
export function taskScopeLabel(task: {
  bankAccount: { bankName: string; agency: string; accountNumber: string } | null;
}): string | null {
  if (!task.bankAccount) return null;
  const { bankName, agency, accountNumber } = task.bankAccount;
  return `${bankName} · ag ${agency} · cc ${accountNumber}`;
}

export function checklistProgress(checklist: Array<{ checkedAt: Date | null }>): {
  done: number;
  total: number;
} {
  return {
    done: checklist.filter((item) => item.checkedAt !== null).length,
    total: checklist.length,
  };
}
