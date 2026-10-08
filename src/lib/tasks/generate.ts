import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { expandOccurrences, utcDay, type RecurrenceSpec } from "./recurrence";

export type GenerationResult = {
  runId: string;
  tasksCreated: number;
  tasksSkipped: number;
  errors: string[];
};

const DEFAULT_HORIZON_DAYS = 30;

/**
 * Materializa as atividades recorrentes de todos os contratos ativos até o
 * horizonte pedido.
 *
 * A idempotência é o requisito central: rodar duas vezes seguidas tem que
 * deixar o banco igual. Ela vem de duas camadas — a consulta prévia dos
 * períodos já existentes e, se duas execuções correrem em paralelo, a unique
 * `(serviceContractId, periodStart)`, cuja violação é contada como pulada em
 * vez de derrubar a execução inteira.
 */
export async function generateTasks({
  horizonDays = DEFAULT_HORIZON_DAYS,
  triggeredById,
  now = new Date(),
  companyId,
  contractId,
}: {
  horizonDays?: number;
  triggeredById?: string;
  now?: Date;
  /** Limita a execução aos contratos de uma empresa (aba Gestão de Tarefas). */
  companyId?: string;
  /** Limita a execução a um único contrato (logo depois de contratar). */
  contractId?: string;
} = {}): Promise<GenerationResult> {
  const from = utcDay(now);
  const to = new Date(from.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const run = await prisma.generationRun.create({
    data: { horizonEnd: to, triggeredById: triggeredById ?? null },
  });

  const errors: string[] = [];
  let tasksCreated = 0;
  let tasksSkipped = 0;

  const contracts = await prisma.serviceContract.findMany({
    where: {
      active: true,
      ...(companyId ? { companyId } : {}),
      ...(contractId ? { id: contractId } : {}),
      startsOn: { lte: to },
      OR: [{ endsOn: null }, { endsOn: { gte: from } }],
      service: { active: true },
    },
    include: {
      service: { include: { checklistTemplate: { orderBy: { order: "asc" } } } },
      company: { select: { id: true, name: true } },
    },
  });

  for (const contract of contracts) {
    if (contract.service.scope === "CONTA_BANCARIA" && !contract.bankAccountId) {
      errors.push(
        `Contrato ${contract.id} (${contract.company.name} / ${contract.service.name}) exige conta bancária e não tem — ignorado.`
      );
      continue;
    }

    const spec: RecurrenceSpec = {
      recurrenceType: contract.recurrenceType,
      dayOfMonth: contract.dayOfMonth,
      weekday: contract.weekday,
      months: contract.months,
      deadlineTime: contract.deadlineTime,
      adjustment: contract.adjustment,
      targetOffsetDays: contract.targetOffsetDays,
      startsOn: contract.startsOn,
      endsOn: contract.endsOn,
    };

    const occurrences = expandOccurrences(spec, from, to);
    if (occurrences.length === 0) {
      continue;
    }

    const existing = await prisma.task.findMany({
      where: {
        serviceContractId: contract.id,
        periodStart: { in: occurrences.map((o) => o.periodStart) },
      },
      select: { periodStart: true },
    });
    const alreadyGenerated = new Set(existing.map((t) => t.periodStart.getTime()));

    for (const occurrence of occurrences) {
      if (alreadyGenerated.has(occurrence.periodStart.getTime())) {
        tasksSkipped += 1;
        continue;
      }

      try {
        await prisma.task.create({
          data: {
            companyId: contract.companyId,
            serviceId: contract.serviceId,
            serviceContractId: contract.id,
            bankAccountId: contract.bankAccountId,
            departmentId: contract.service.departmentId,
            periodStart: occurrence.periodStart,
            periodEnd: occurrence.periodEnd,
            dueDateLegal: occurrence.dueDateLegal,
            dueDateTarget: occurrence.dueDateTarget,
            assigneeId: contract.assigneeId,
            origin: "RECORRENTE",
            // Snapshot: alterar o checklist do serviço depois não mexe em
            // tarefa já gerada.
            checklist: {
              create: contract.service.checklistTemplate.map((item) => ({
                order: item.order,
                text: item.text,
                required: item.required,
              })),
            },
          },
        });
        tasksCreated += 1;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          // Outra execução criou o mesmo período entre a consulta e o insert.
          tasksSkipped += 1;
          continue;
        }
        throw error;
      }
    }
  }

  await prisma.generationRun.update({
    where: { id: run.id },
    data: {
      finishedAt: new Date(),
      tasksCreated,
      tasksSkipped,
      errors: errors.length > 0 ? errors.join("\n") : null,
    },
  });

  return { runId: run.id, tasksCreated, tasksSkipped, errors };
}
