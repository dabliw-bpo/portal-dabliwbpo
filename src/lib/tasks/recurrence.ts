import type { NonBusinessDayAdjustment, RecurrenceType } from "@prisma/client";

/**
 * Toda a aritmética de datas aqui roda em UTC, de propósito.
 *
 * `periodStart` é metade da chave de idempotência do gerador
 * (`@@unique([serviceContractId, periodStart])`). Se ele fosse construído no
 * fuso local do servidor, mudar o fuso — ou rodar o gerador em outra máquina —
 * produziria um timestamp diferente para o mesmo período e a unique deixaria
 * de proteger contra duplicata.
 *
 * O horário de corte (`deadlineTime`) é hora de parede brasileira, então é
 * convertido com deslocamento fixo de UTC-3. O Brasil não adota horário de
 * verão desde 2019; se voltar a adotar, este é o ponto único a corrigir.
 */
export const BRAZIL_UTC_OFFSET_HOURS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

export type RecurrenceSpec = {
  recurrenceType: RecurrenceType;
  dayOfMonth: number | null;
  weekday: number | null;
  months: number[];
  deadlineTime: string;
  adjustment: NonBusinessDayAdjustment;
  targetOffsetDays: number;
  startsOn: Date;
  endsOn: Date | null;
};

export type Occurrence = {
  periodStart: Date;
  periodEnd: Date;
  dueDateLegal: Date;
  dueDateTarget: Date;
};

/** Zera para a meia-noite UTC do dia correspondente. */
export function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Dia útil aqui é apenas "não é sábado nem domingo". Feriado nacional ainda
 * não é tratado — a tabela `Holiday` é do bloco 1 do plano maior. Até lá, uma
 * obrigação que cai em feriado gera prazo otimista e precisa de ajuste manual.
 */
export function isBusinessDay(date: Date): boolean {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

export function shiftToBusinessDay(date: Date, adjustment: NonBusinessDayAdjustment): Date {
  if (adjustment === "MANTER" || isBusinessDay(date)) {
    return date;
  }
  const step = adjustment === "ANTECIPAR" ? -1 : 1;
  let cursor = date;
  while (!isBusinessDay(cursor)) {
    cursor = addDaysUtc(cursor, step);
  }
  return cursor;
}

export function subtractBusinessDays(date: Date, days: number): Date {
  let remaining = Math.max(0, days);
  let cursor = date;
  while (remaining > 0) {
    cursor = addDaysUtc(cursor, -1);
    if (isBusinessDay(cursor)) {
      remaining -= 1;
    }
  }
  return cursor;
}

/** Combina um dia (meia-noite UTC) com o horário de corte brasileiro. */
export function applyDeadlineTime(day: Date, deadlineTime: string): Date {
  const [rawHours, rawMinutes] = deadlineTime.split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);
  const safeHours = Number.isFinite(hours) ? hours : 18;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return new Date(
    day.getTime() + (safeHours + BRAZIL_UTC_OFFSET_HOURS) * 60 * 60 * 1000 + safeMinutes * 60 * 1000
  );
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Segunda-feira da semana ISO a que a data pertence. */
function startOfIsoWeek(date: Date): Date {
  const weekday = date.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  return addDaysUtc(utcDay(date), -daysSinceMonday);
}

/**
 * Datas em que a obrigação vence, e o período que cada uma cobre.
 * Devolve pares (dia de vencimento antes de ajuste, período coberto).
 */
function rawOccurrences(
  spec: RecurrenceSpec,
  from: Date,
  to: Date
): Array<{ dueDay: Date; periodStart: Date; periodEnd: Date }> {
  const out: Array<{ dueDay: Date; periodStart: Date; periodEnd: Date }> = [];
  const start = utcDay(from);
  const end = utcDay(to);

  switch (spec.recurrenceType) {
    case "DIARIA": {
      for (let cursor = start; cursor <= end; cursor = addDaysUtc(cursor, 1)) {
        if (!isBusinessDay(cursor)) continue;
        out.push({ dueDay: cursor, periodStart: cursor, periodEnd: cursor });
      }
      break;
    }

    case "SEMANAL": {
      const targetWeekday = spec.weekday ?? 1;
      let week = startOfIsoWeek(start);
      while (week <= end) {
        // Domingo (0) pertence ao fim da semana ISO, não ao começo.
        const offset = targetWeekday === 0 ? 6 : targetWeekday - 1;
        const dueDay = addDaysUtc(week, offset);
        const periodEnd = addDaysUtc(week, 6);
        if (dueDay >= start && dueDay <= end) {
          out.push({ dueDay, periodStart: week, periodEnd });
        }
        week = addDaysUtc(week, 7);
      }
      break;
    }

    case "QUINZENAL": {
      // A âncora é o início de vigência do contrato: sem ela, "a cada 14 dias"
      // não tem referência e o resultado muda a cada execução do gerador.
      const anchor = utcDay(spec.startsOn);
      let cursor = anchor;
      while (cursor < start) {
        cursor = addDaysUtc(cursor, 14);
      }
      while (cursor <= end) {
        out.push({ dueDay: cursor, periodStart: cursor, periodEnd: addDaysUtc(cursor, 13) });
        cursor = addDaysUtc(cursor, 14);
      }
      break;
    }

    case "MENSAL":
    case "TRIMESTRAL":
    case "ANUAL": {
      const wantedMonths =
        spec.recurrenceType === "MENSAL" || spec.months.length === 0 ? null : new Set(spec.months);
      const day = spec.dayOfMonth ?? 1;

      let year = start.getUTCFullYear();
      let monthIndex = start.getUTCMonth();
      let guard = 0;
      while (guard < 240) {
        guard += 1;
        const periodStart = new Date(Date.UTC(year, monthIndex, 1));
        if (periodStart > end) break;

        if (!wantedMonths || wantedMonths.has(monthIndex + 1)) {
          const clampedDay = Math.min(day, lastDayOfMonth(year, monthIndex));
          const dueDay = new Date(Date.UTC(year, monthIndex, clampedDay));
          const periodEnd = new Date(Date.UTC(year, monthIndex, lastDayOfMonth(year, monthIndex)));
          if (dueDay >= start && dueDay <= end) {
            out.push({ dueDay, periodStart, periodEnd });
          }
        }

        monthIndex += 1;
        if (monthIndex > 11) {
          monthIndex = 0;
          year += 1;
        }
      }
      break;
    }
  }

  return out;
}

/**
 * Expande a regra do contrato em ocorrências concretas dentro da janela.
 *
 * Só devolve ocorrências cujo vencimento legal cai entre `from` e `to`, o que
 * implementa duas decisões do spec: o gerador não cria tarefa retroativa
 * (quem chama passa `from = hoje`) e respeita a vigência do contrato.
 */
export function expandOccurrences(spec: RecurrenceSpec, from: Date, to: Date): Occurrence[] {
  const windowStart = utcDay(spec.startsOn) > utcDay(from) ? utcDay(spec.startsOn) : utcDay(from);
  const windowEnd = spec.endsOn && utcDay(spec.endsOn) < utcDay(to) ? utcDay(spec.endsOn) : utcDay(to);
  if (windowStart > windowEnd) {
    return [];
  }

  // A janela de busca é folgada porque o ajuste de dia não-útil e o clamp de
  // fim de mês podem empurrar o vencimento para dentro ou para fora dela.
  const searchStart = addDaysUtc(windowStart, -7);
  const searchEnd = addDaysUtc(windowEnd, 7);

  return rawOccurrences(spec, searchStart, searchEnd)
    .map(({ dueDay, periodStart, periodEnd }) => {
      const adjustedDueDay = shiftToBusinessDay(dueDay, spec.adjustment);
      const targetDay = subtractBusinessDays(adjustedDueDay, spec.targetOffsetDays);
      return {
        periodStart,
        periodEnd,
        dueDateLegal: applyDeadlineTime(adjustedDueDay, spec.deadlineTime),
        dueDateTarget: applyDeadlineTime(targetDay, spec.deadlineTime),
      };
    })
    .filter((occurrence) => {
      const dueDay = utcDay(occurrence.dueDateLegal);
      return dueDay >= windowStart && dueDay <= windowEnd;
    })
    .sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
}

export const WEEKDAY_NAMES = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;

export const MONTH_NAMES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
] as const;

/** Frase curta descrevendo a regra do contrato, para listagem. */
export function describeRecurrence(rule: {
  recurrenceType: RecurrenceType;
  dayOfMonth: number | null;
  weekday: number | null;
  months: number[];
  deadlineTime: string;
}): string {
  const at = ` às ${rule.deadlineTime}`;
  switch (rule.recurrenceType) {
    case "DIARIA":
      return `Todo dia útil${at}`;
    case "SEMANAL":
      return `Toda ${WEEKDAY_NAMES[rule.weekday ?? 1]}${at}`;
    case "QUINZENAL":
      return `A cada 15 dias${at}`;
    case "MENSAL":
      return `Todo dia ${rule.dayOfMonth ?? 1}${at}`;
    case "TRIMESTRAL":
    case "ANUAL": {
      const months = rule.months
        .slice()
        .sort((a, b) => a - b)
        .map((m) => MONTH_NAMES[m - 1])
        .join(", ");
      return `Dia ${rule.dayOfMonth ?? 1} de ${months || "—"}${at}`;
    }
  }
}

/** Rótulo do período para exibição, derivado — não é coluna no banco. */
export function periodLabel(type: RecurrenceType, periodStart: Date, periodEnd: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  switch (type) {
    case "DIARIA":
      return fmt(periodStart);
    case "SEMANAL":
    case "QUINZENAL":
      return `${fmt(periodStart)} a ${fmt(periodEnd)}`;
    case "MENSAL":
    case "TRIMESTRAL":
    case "ANUAL":
      return periodStart
        .toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" })
        .replace(".", "");
  }
}
