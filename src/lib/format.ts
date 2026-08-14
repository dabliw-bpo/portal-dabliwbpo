import { vacationOptionLabel } from "@/lib/validations/vacation";

/**
 * Horário oficial de Brasília — a referência do app para tudo que é carimbado
 * com data e hora. O servidor roda em UTC, então nada deve perguntar a hora a
 * ele diretamente.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

/**
 * Deslocamento em relação ao GMT, derivado da própria data. Fica correto mesmo
 * se o horário de verão voltar, em vez de carregar "-3:00" escrito à mão.
 */
export function gmtOffsetLabel(date: Date = new Date()): string {
  return (
    new Intl.DateTimeFormat("en-US", { timeZone: APP_TIME_ZONE, timeZoneName: "longOffset" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT-03:00"
  );
}

/** Centavos inteiros para "R$ 1.234,56" — dinheiro nunca vira float aqui. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** O mesmo valor sem o símbolo, para preencher o campo de edição. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** Centavos inteiros -> `R$ 1.234,56`, para valores monetários exibidos ou impressos. */
export function formatCurrencyBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100
  );
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
 * usuário combinou 12:00, então a formatação é fixada no horário de Brasília.
 */
export function formatDeadline(date: Date): string {
  return date.toLocaleString("pt-BR", {
    timeZone: APP_TIME_ZONE,
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
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  });
  const time = date.toLocaleTimeString("pt-BR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} às ${time}`;
}
