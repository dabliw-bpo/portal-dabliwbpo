import type { DocumentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BRAZIL_UTC_OFFSET_HOURS } from "@/lib/tasks/recurrence";
import { OPEN_STATUSES } from "@/lib/tasks/urgency";

/**
 * O que está esperando alguém, empresa por empresa. Alimenta o painel do admin
 * e a lista de pendências da aba Folha — as duas telas leem daqui para não
 * divergirem sobre o que conta como pendência.
 */

export type PendingDocument = {
  id: string;
  title: string;
  type: DocumentType;
  createdAt: Date;
  userId: string;
  userName: string;
  /** Preenchido quando o PDF é de um recibo de pagamento: ele tem aba própria. */
  receiptId: string | null;
};

export type PendingVacation = {
  id: string;
  userId: string;
  userName: string;
  startDate: Date;
};

export type DraftReceipt = {
  id: string;
  userId: string;
  userName: string;
  description: string;
};

export type CompanyAlerts = {
  companyId: string;
  name: string;
  isHeadquarters: boolean;
  documents: PendingDocument[];
  vacations: PendingVacation[];
  draftReceipts: DraftReceipt[];
  overdueTasks: number;
  dueTodayTasks: number;
};

/** Total de itens que pedem ação — para ordenar e para saber se a empresa está em dia. */
export function alertWeight(alerts: CompanyAlerts): number {
  return (
    alerts.documents.length +
    alerts.vacations.length +
    alerts.draftReceipts.length +
    alerts.overdueTasks +
    alerts.dueTodayTasks
  );
}

/**
 * Limites do dia de hoje em Brasília, como instantes UTC. O prazo das
 * atividades é gravado em UTC; "hoje" para a equipe é o dia de Brasília.
 */
export function brasiliaDayBounds(now: Date = new Date()): { start: Date; end: Date } {
  const shifted = new Date(now.getTime() - BRAZIL_UTC_OFFSET_HOURS * 60 * 60 * 1000);
  const start = new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      BRAZIL_UTC_OFFSET_HOURS
    )
  );
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/**
 * Pendências de todas as empresas, ou só de uma. A leitura é do admin, então
 * não há recorte de papel aqui.
 */
export async function loadCompanyAlerts(companyId?: string): Promise<CompanyAlerts[]> {
  const now = new Date();
  const { end } = brasiliaDayBounds(now);
  const companyFilter = companyId ? { id: companyId } : {};

  const [companies, documents, vacations, receipts, overdue, dueToday] = await Promise.all([
    prisma.company.findMany({
      where: companyFilter,
      orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
      select: { id: true, name: true, isHeadquarters: true },
    }),
    prisma.document.findMany({
      where: {
        status: "PENDING_SIGNATURE",
        taskId: null,
        owner: companyId ? { companyId } : { companyId: { not: null } },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        owner: { select: { id: true, name: true, companyId: true } },
        paymentReceipt: { select: { id: true } },
      },
    }),
    prisma.vacationRequest.findMany({
      where: {
        status: "REQUESTED",
        collaborator: companyId ? { companyId } : { companyId: { not: null } },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        startDate: true,
        collaborator: { select: { id: true, name: true, companyId: true } },
      },
    }),
    prisma.paymentReceipt.findMany({
      where: { documentId: null, ...(companyId ? { companyId } : {}) },
      orderBy: { issuedAt: "asc" },
      select: {
        id: true,
        description: true,
        companyId: true,
        collaborator: { select: { id: true, name: true } },
      },
    }),
    prisma.task.groupBy({
      by: ["companyId"],
      where: {
        ...(companyId ? { companyId } : {}),
        status: { in: [...OPEN_STATUSES] },
        dueDateLegal: { lt: now },
      },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["companyId"],
      where: {
        ...(companyId ? { companyId } : {}),
        status: { in: [...OPEN_STATUSES] },
        dueDateLegal: { gte: now, lt: end },
      },
      _count: { _all: true },
    }),
  ]);

  const overdueBy = new Map(overdue.map((row) => [row.companyId, row._count._all]));
  const dueTodayBy = new Map(dueToday.map((row) => [row.companyId, row._count._all]));

  return companies.map((company) => ({
    companyId: company.id,
    name: company.name,
    isHeadquarters: company.isHeadquarters,
    documents: documents
      .filter((doc) => doc.owner.companyId === company.id)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        createdAt: doc.createdAt,
        userId: doc.owner.id,
        userName: doc.owner.name,
        receiptId: doc.paymentReceipt?.id ?? null,
      })),
    vacations: vacations
      .filter((request) => request.collaborator.companyId === company.id)
      .map((request) => ({
        id: request.id,
        userId: request.collaborator.id,
        userName: request.collaborator.name,
        startDate: request.startDate,
      })),
    draftReceipts: receipts
      .filter((receipt) => receipt.companyId === company.id)
      .map((receipt) => ({
        id: receipt.id,
        userId: receipt.collaborator.id,
        userName: receipt.collaborator.name,
        description: receipt.description,
      })),
    overdueTasks: overdueBy.get(company.id) ?? 0,
    dueTodayTasks: dueTodayBy.get(company.id) ?? 0,
  }));
}

/** A aba do colaborador onde o documento pendente é tratado. */
export function documentTabHref(base: string, doc: PendingDocument): string {
  if (doc.receiptId) return `${base}/${doc.userId}/recibos/${doc.receiptId}`;
  switch (doc.type) {
    case "PAYSLIP":
      return `${base}/${doc.userId}/holerites`;
    case "VACATION_REQUEST":
      return `${base}/${doc.userId}/ferias`;
    default:
      return `${base}/${doc.userId}/documentos`;
  }
}
