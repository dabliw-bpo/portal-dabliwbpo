import { vacationOptionLabel } from "@/lib/validations/vacation";

export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/**
 * How a vacation request reads in a list. Requests predating the change still
 * carry an end date, so both shapes are handled, and the chosen option is
 * appended when there is one.
 */
export function formatVacationPeriod(request: {
  startDate: Date;
  endDate: Date | null;
  option?: string | null;
}): string {
  const period = request.endDate
    ? `${formatDateOnly(request.startDate)} a ${formatDateOnly(request.endDate)}`
    : `A partir de ${formatDateOnly(request.startDate)}`;

  const label = vacationOptionLabel(request.option ?? null);
  return label ? `${period} · ${label}` : period;
}

/**
 * Prazos de atividade carregam hora (o corte bancário mora nela), e são
 * gravados como instante absoluto. Exibir em UTC mostraria 15:00 onde o
 * usuário combinou 12:00, então a formatação é fixada no fuso de operação.
 */
const OPERATION_TIME_ZONE = "America/Sao_Paulo";

export function formatDeadline(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: OPERATION_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Versão curta para listas: `10/08 às 12:00`. */
export function formatDeadlineShort(date: Date): string {
  const day = date.toLocaleDateString("pt-BR", {
    timeZone: OPERATION_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  });
  const time = date.toLocaleTimeString("pt-BR", {
    timeZone: OPERATION_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} às ${time}`;
}
