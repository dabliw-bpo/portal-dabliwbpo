import type { TaskOrigin, TaskStatus } from "@prisma/client";
import { APP_TIME_ZONE } from "@/lib/format";
import { isOpen, urgencyOf, type Urgency } from "./urgency";

/**
 * A árvore da aba Gestão de Tarefas de uma empresa:
 *
 *   Serviço → (Conta bancária) → Mês → demandas com data
 *
 * Só agrupa e ordena; nada aqui toca o banco. Datas viram texto já no fuso de
 * Brasília porque o componente de linha é de cliente e não deve decidir fuso.
 */

export type TreeChecklistItem = {
  id: string;
  text: string;
  required: boolean;
  checked: boolean;
};

export type TreeTask = {
  id: string;
  status: TaskStatus;
  origin: TaskOrigin;
  urgency: Urgency;
  dueDateLegal: Date;
  dayLabel: string;
  weekdayLabel: string;
  deadlineLabel: string;
  assigneeName: string | null;
  checklist: TreeChecklistItem[];
  documentCount: number;
  requiresDocument: boolean;
};

export type MonthNode = {
  key: string;
  label: string;
  tasks: TreeTask[];
  done: number;
  open: number;
  overdue: number;
};

export type AccountNode = {
  key: string;
  /** `null` quando o serviço não é por conta bancária. */
  label: string | null;
  months: MonthNode[];
};

export type ServiceNode = {
  key: string;
  name: string;
  departmentName: string;
  recurrence: string | null;
  contractActive: boolean | null;
  accounts: AccountNode[];
  open: number;
  overdue: number;
};

export type TreeSourceTask = {
  id: string;
  status: TaskStatus;
  origin: TaskOrigin;
  dueDateLegal: Date;
  dueDateTarget: Date;
  serviceId: string;
  bankAccountId: string | null;
  assignee: { name: string } | null;
  checklist: Array<{ id: string; text: string; required: boolean; order: number; checkedAt: Date | null }>;
  service: { name: string; requiresDocument: boolean; department: { name: string } };
  bankAccount: { bankName: string; agency: string; accountNumber: string } | null;
  _count: { documents: number };
};

export type TreeSourceContract = {
  serviceId: string;
  bankAccountId: string | null;
  active: boolean;
  recurrence: string;
  service: { name: string; department: { name: string } };
  bankAccount: { bankName: string; agency: string; accountNumber: string } | null;
};

const collator = new Intl.Collator("pt-BR");

function brasiliaParts(date: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const pick = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: pick("year"), month: pick("month") };
}

export function monthKeyOf(date: Date): string {
  const { year, month } = brasiliaParts(date);
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLabelOf(key: string): string {
  const [year, month] = key.split("-").map(Number);
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function accountLabel(account: { bankName: string; agency: string; accountNumber: string }): string {
  return `${account.bankName} · ag ${account.agency} · cc ${account.accountNumber}`;
}

function toTreeTask(task: TreeSourceTask, now: Date): TreeTask {
  const checklist = task.checklist
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      text: item.text,
      required: item.required,
      checked: item.checkedAt !== null,
    }));

  return {
    id: task.id,
    status: task.status,
    origin: task.origin,
    urgency: urgencyOf(task, now),
    dueDateLegal: task.dueDateLegal,
    dayLabel: task.dueDateLegal.toLocaleDateString("pt-BR", {
      timeZone: APP_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
    }),
    weekdayLabel: task.dueDateLegal
      .toLocaleDateString("pt-BR", { timeZone: APP_TIME_ZONE, weekday: "short" })
      .replace(".", ""),
    deadlineLabel: task.dueDateLegal.toLocaleString("pt-BR", {
      timeZone: APP_TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    assigneeName: task.assignee?.name ?? null,
    checklist,
    documentCount: task._count.documents,
    requiresDocument: task.service.requiresDocument,
  };
}

function buildMonths(tasks: TreeTask[]): MonthNode[] {
  const byMonth = new Map<string, TreeTask[]>();
  for (const task of tasks) {
    const key = monthKeyOf(task.dueDateLegal);
    byMonth.set(key, [...(byMonth.get(key) ?? []), task]);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthTasks]) => {
      const sorted = monthTasks
        .slice()
        .sort((a, b) => a.dueDateLegal.getTime() - b.dueDateLegal.getTime());
      return {
        key,
        label: monthLabelOf(key),
        tasks: sorted,
        done: sorted.filter((t) => t.status === "CONCLUIDA").length,
        open: sorted.filter((t) => isOpen(t.status)).length,
        overdue: sorted.filter((t) => t.urgency === "VENCIDA").length,
      };
    });
}

/**
 * Monta a árvore a partir das demandas e dos contratos da empresa. Os
 * contratos entram para que um serviço recém-contratado, ainda sem nenhuma
 * demanda, apareça na árvore em vez de sumir.
 */
export function buildCompanyTree(
  tasks: TreeSourceTask[],
  contracts: TreeSourceContract[],
  now: Date = new Date()
): ServiceNode[] {
  type Draft = {
    key: string;
    name: string;
    departmentName: string;
    recurrence: string | null;
    contractActive: boolean | null;
    accounts: Map<string, { label: string | null; tasks: TreeTask[] }>;
  };

  const services = new Map<string, Draft>();

  const draftFor = (serviceId: string, name: string, departmentName: string): Draft => {
    let draft = services.get(serviceId);
    if (!draft) {
      draft = {
        key: serviceId,
        name,
        departmentName,
        recurrence: null,
        contractActive: null,
        accounts: new Map(),
      };
      services.set(serviceId, draft);
    }
    return draft;
  };

  const accountFor = (
    draft: Draft,
    bankAccountId: string | null,
    account: { bankName: string; agency: string; accountNumber: string } | null
  ) => {
    const key = bankAccountId ?? "-";
    let node = draft.accounts.get(key);
    if (!node) {
      node = { label: account ? accountLabel(account) : null, tasks: [] };
      draft.accounts.set(key, node);
    }
    return node;
  };

  for (const contract of contracts) {
    const draft = draftFor(contract.serviceId, contract.service.name, contract.service.department.name);
    // Um serviço por conta tem um contrato para cada conta; o resumo da regra
    // fica com o primeiro e só vira "inativo" se todos estiverem inativos.
    draft.recurrence ??= contract.recurrence;
    draft.contractActive = (draft.contractActive ?? false) || contract.active;
    accountFor(draft, contract.bankAccountId, contract.bankAccount);
  }

  for (const task of tasks) {
    const draft = draftFor(task.serviceId, task.service.name, task.service.department.name);
    accountFor(draft, task.bankAccountId, task.bankAccount).tasks.push(toTreeTask(task, now));
  }

  return [...services.values()]
    .map((draft): ServiceNode => {
      const accounts = [...draft.accounts.entries()]
        .map(([key, node]): AccountNode => ({
          key,
          label: node.label,
          months: buildMonths(node.tasks),
        }))
        .sort((a, b) => collator.compare(a.label ?? "", b.label ?? ""));
      const allMonths = accounts.flatMap((a) => a.months);
      return {
        key: draft.key,
        name: draft.name,
        departmentName: draft.departmentName,
        recurrence: draft.recurrence,
        contractActive: draft.contractActive,
        accounts,
        open: allMonths.reduce((sum, m) => sum + m.open, 0),
        overdue: allMonths.reduce((sum, m) => sum + m.overdue, 0),
      };
    })
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** O mês começa aberto se ainda tem coisa a fazer ou se é o atual/futuro. */
export function monthStartsOpen(month: MonthNode, now: Date = new Date()): boolean {
  return month.open > 0 || month.key >= monthKeyOf(now);
}
