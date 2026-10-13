import { z } from "zod";

/**
 * Converte o valor digitado ("1.234,56" ou "1234.56") em centavos inteiros,
 * evitando o arredondamento de ponto flutuante em cima de dinheiro.
 */
function parseAmountToCents(value: unknown): unknown {
  if (typeof value !== "string") return value;

  const raw = value.trim().replace(/\s|R\$/g, "");
  if (raw === "") return undefined;

  let normalized: string;
  if (raw.includes(",")) {
    // Formato brasileiro: ponto agrupa, vírgula separa os centavos.
    normalized = raw.replace(/\./g, "").replace(",", ".");
  } else {
    // Sem vírgula o ponto é ambíguo. Três dígitos depois dele são milhar
    // ("1.500"); um ou dois são centavos ("1500.50"), como sai de planilha.
    // Tratar todo ponto como milhar multiplicava esse caso por cem.
    const lastDot = raw.lastIndexOf(".");
    const decimals = lastDot === -1 ? 0 : raw.length - lastDot - 1;
    normalized =
      decimals === 1 || decimals === 2
        ? raw.slice(0, lastDot).replace(/\./g, "") + "." + raw.slice(lastDot + 1)
        : raw.replace(/\./g, "");
  }

  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? value : Math.round(parsed * 100);
}

export const receiptSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição do pagamento.").max(500),
  amountCents: z.preprocess(
    parseAmountToCents,
    z.number().int().min(1, "Informe um valor maior que zero.")
  ),
});

/**
 * Dia do pagamento, como sai de `<input type="date">` (AAAA-MM-DD). A data
 * entra no banco como meia-noite UTC e é exibida em UTC, para não recuar um
 * dia no fuso de Brasília.
 */
export const paidAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do pagamento.")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    );
  }, "Data do pagamento inválida.");

export function paidAtToDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}
