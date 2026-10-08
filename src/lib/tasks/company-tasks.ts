import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { OPEN_STATUSES } from "./urgency";

/** Concluídas antigas saem da árvore; o que está em aberto fica sempre. */
export const JANELA_HISTORICO_DIAS = 120;

/**
 * As demandas de uma empresa para montar a árvore da aba Gestão de Tarefas.
 *
 * O `scope` é o recorte de papel (`taskScopeFor`): o admin passa `{}`, a equipe
 * da Matriz passa o recorte dela, e ele entra como termo do `AND` para que
 * nada vindo da tela o amplie.
 *
 * Concluídas e canceladas ficam de fora por padrão: com dezenas de contas
 * gerando demanda todo dia útil, a página só é legível se mostrar o que ainda
 * falta fazer. `incluirEncerradas` traz de volta a janela de histórico.
 */
export function loadCompanyTasks(
  companyId: string,
  scope: Prisma.TaskWhereInput,
  agora: Date = new Date(),
  { incluirEncerradas = false }: { incluirEncerradas?: boolean } = {}
) {
  const desde = new Date(agora.getTime() - JANELA_HISTORICO_DIAS * 24 * 60 * 60 * 1000);
  const janela: Prisma.TaskWhereInput = incluirEncerradas
    ? { OR: [{ dueDateLegal: { gte: desde } }, { status: { in: [...OPEN_STATUSES] } }] }
    : { status: { in: [...OPEN_STATUSES] } };

  return prisma.task.findMany({
    where: {
      AND: [
        scope,
        { companyId },
        janela,
      ],
    },
    orderBy: [{ dueDateLegal: "asc" }, { id: "asc" }],
    include: {
      service: {
        select: { name: true, department: { select: { name: true } } },
      },
      bankAccount: { select: { bankName: true, agency: true, accountNumber: true } },
      assignee: { select: { name: true } },
      checklist: {
        orderBy: { order: "asc" },
        select: { id: true, text: true, required: true, order: true, checkedAt: true },
      },
      _count: { select: { documents: true } },
    },
  });
}

/** Quantas concluídas/canceladas ficam escondidas na árvore (dentro do recorte). */
export function countEncerradas(companyId: string, scope: Prisma.TaskWhereInput) {
  return prisma.task.count({
    where: { AND: [scope, { companyId }, { status: { in: ["CONCLUIDA", "CANCELADA"] } }] },
  });
}
