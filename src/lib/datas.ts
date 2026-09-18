import { APP_TIME_ZONE } from "@/lib/format";

/** 28/08/2026, no horário oficial do app. */
export function dataCurta(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** "Sexta-feira, 18 de setembro" — a data de hoje, para a saudação. */
export function hojePorExtenso(agora: Date = new Date()): string {
  const texto = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(agora);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
