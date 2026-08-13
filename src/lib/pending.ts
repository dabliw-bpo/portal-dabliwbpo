import { prisma } from "@/lib/prisma";

/**
 * Work waiting on someone: vacation requests an admin still has to review,
 * and documents whose recipient has not signed yet.
 */

export async function countCompanyPending(companyId: string): Promise<number> {
  const [vacations, documents] = await Promise.all([
    prisma.vacationRequest.count({
      where: { status: "REQUESTED", collaborator: { companyId } },
    }),
    prisma.document.count({
      where: { status: "PENDING_SIGNATURE", owner: { companyId } },
    }),
  ]);

  return vacations + documents;
}

/** Números do topo do painel: o tamanho da operação de relance. */
export async function loadDashboardStats() {
  const [companies, activePeople, vacations, documents] = await Promise.all([
    prisma.company.count(),
    prisma.user.count({ where: { active: true, companyId: { not: null } } }),
    prisma.vacationRequest.count({ where: { status: "REQUESTED" } }),
    prisma.document.count({ where: { status: "PENDING_SIGNATURE" } }),
  ]);

  return { companies, activePeople, pending: vacations + documents };
}

export async function listPendingWork() {
  const [vacations, documents] = await Promise.all([
    prisma.vacationRequest.findMany({
      where: { status: "REQUESTED" },
      orderBy: { createdAt: "asc" },
      include: { collaborator: { include: { company: true } } },
    }),
    prisma.document.findMany({
      where: { status: "PENDING_SIGNATURE" },
      orderBy: { createdAt: "asc" },
      include: { owner: { include: { company: true } } },
    }),
  ]);

  return { vacations, documents };
}
