import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { brasiliaDayBounds } from "@/lib/company-alerts";
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
/** Recortes que o painel do admin usa para levar direto ao que está pendente. */
export type RecorteTarefas = "vencidas" | "hoje";

export function parseRecorte(value: string | string[] | undefined): RecorteTarefas | null {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "vencidas" || first === "hoje" ? first : null;
}

export function loadCompanyTasks(
  companyId: string,
  scope: Prisma.TaskWhereInput,
  agora: Date = new Date(),
  {
    incluirEncerradas = false,
    recorte = null,
  }: { incluirEncerradas?: boolean; recorte?: RecorteTarefas | null } = {}
) {
  const desde = new Date(agora.getTime() - JANELA_HISTORICO_DIAS * 24 * 60 * 60 * 1000);
  const abertas: Prisma.TaskWhereInput = { status: { in: [...OPEN_STATUSES] } };
  let janela: Prisma.TaskWhereInput;
  if (recorte === "vencidas") {
    janela = { AND: [abertas, { dueDateLegal: { lt: agora } }] };
  } else if (recorte === "hoje") {
    // Vence hoje (em Brasília) e ainda não passou do prazo — a mesma conta do painel.
    janela = { AND: [abertas, { dueDateLegal: { gte: agora, lt: brasiliaDayBounds(agora).end } }] };
  } else {
    janela = incluirEncerradas
      ? { OR: [{ dueDateLegal: { gte: desde } }, abertas] }
      : abertas;
  }

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
