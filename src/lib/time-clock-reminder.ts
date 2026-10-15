import { Prisma } from "@prisma/client";
import { sendTimeClockReminderEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { currentMonthKey, monthName, splitMonthKey } from "@/lib/time-clock";

/** O mês anterior a `key`, como "AAAA-MM". */
export function previousMonthKey(key: string): string {
  const { year, month } = splitMonthKey(key);
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** "setembro de 2026" — o mês por extenso, em minúsculas, como cabe na frase. */
export function monthLabelLower(key: string): string {
  const { year, month } = splitMonthKey(key);
  return `${monthName(month).toLowerCase()} de ${year}`;
}

export type ReminderResult = {
  referenceMonth: string;
  recipients: number;
  sent: number;
  alreadySent: number;
  failed: number;
};

/**
 * Manda o lembrete do ponto do mês anterior a cada colaborador ativo.
 *
 * Quando o mês vira, o ponto que acabou de fechar é o do mês anterior — é ele
 * que o lembrete cita. Cada envio reserva antes uma linha em
 * `TimeClockReminder` (unique por colaborador e mês): reexecutar o
 * agendamento, ou duas execuções ao mesmo tempo, não manda o aviso em dobro; se
 * o envio falha, a reserva é desfeita e uma nova execução tenta de novo.
 *
 * `dryRun` só conta e não envia nada nem grava.
 */
export async function sendMonthlyTimeClockReminders({
  now = new Date(),
  dryRun = false,
}: { now?: Date; dryRun?: boolean } = {}): Promise<ReminderResult> {
  const referenceMonth = previousMonthKey(currentMonthKey(now));
  const monthLabel = monthLabelLower(referenceMonth);
  const appUrl = process.env.APP_URL;
  const url = `${appUrl ?? ""}/portal-colaborador/ponto?mes=${referenceMonth}`;

  const collaborators = await prisma.user.findMany({
    where: { role: "COLLABORATOR", active: true, companyId: { not: null } },
    orderBy: { name: "asc" },
    select: { id: true, email: true },
  });

  const result: ReminderResult = {
    referenceMonth,
    recipients: collaborators.length,
    sent: 0,
    alreadySent: 0,
    failed: 0,
  };

  if (dryRun) {
    result.alreadySent = await prisma.timeClockReminder.count({ where: { referenceMonth } });
    return result;
  }
  if (!appUrl) {
    // Sem o endereço do portal o link sairia quebrado: melhor não enviar.
    console.error("[ponto] APP_URL não configurado; lembrete mensal não enviado.");
    result.failed = collaborators.length;
    return result;
  }

  for (const collaborator of collaborators) {
    try {
      await prisma.timeClockReminder.create({
        data: { collaboratorUserId: collaborator.id, referenceMonth },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        result.alreadySent += 1;
        continue;
      }
      throw error;
    }

    const sent = await sendTimeClockReminderEmail({ to: collaborator.email, monthLabel, url });
    if (sent.ok) {
      result.sent += 1;
    } else {
      result.failed += 1;
      await prisma.timeClockReminder
        .delete({
          where: {
            collaboratorUserId_referenceMonth: {
              collaboratorUserId: collaborator.id,
              referenceMonth,
            },
          },
        })
        .catch(() => undefined);
    }
  }

  return result;
}
