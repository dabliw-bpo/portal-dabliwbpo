export function formatDateOnly(date: Date): string {
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
