import { APP_TIME_ZONE } from "@/lib/format";

/**
 * Controle de envios de ponto: o colaborador manda fotos ou arquivos do cartão
 * de ponto e o BPO acompanha, mês a mês, quem enviou o quê. O mês de
 * referência é uma chave "AAAA-MM" — texto, para ordenar e comparar sem fuso.
 */

/** Tipos aceitos: o que o celular produz (foto, PDF) e nada executável. */
export const TIME_CLOCK_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const TIME_CLOCK_MAX_BYTES = 15 * 1024 * 1024;
export const TIME_CLOCK_MAX_FILES_PER_SEND = 10;

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** Mês corrente em Brasília, como "AAAA-MM". */
export function currentMonthKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

export function splitMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number);
  return { year, month };
}

/** Meses de `from` até `to`, do mais recente para o mais antigo. */
export function monthsDescending(from: string, to: string): string[] {
  const start = splitMonthKey(from);
  const end = splitMonthKey(to);
  const out: string[] = [];
  let year = end.year;
  let month = end.month;
  let guard = 0;
  while ((year > start.year || (year === start.year && month >= start.month)) && guard < 600) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    guard += 1;
  }
  return out;
}

/** Um mês não pode ser futuro. */
export function isFutureMonth(key: string, now: Date = new Date()): boolean {
  return key > currentMonthKey(now);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Confere os primeiros bytes do arquivo contra o tipo declarado. O `type` que
 * o navegador manda é só uma declaração; sem esta conferência qualquer coisa
 * poderia entrar com a etiqueta "image/jpeg".
 */
export function sniffMimeType(buffer: Buffer): (typeof TIME_CLOCK_MIME_TYPES)[number] | null {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (
    buffer.subarray(0, 4).toString("latin1") === "RIFF" &&
    buffer.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = buffer.subarray(8, 12).toString("latin1");
    if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) {
      return brand === "mif1" || brand === "msf1" ? "image/heif" : "image/heic";
    }
  }
  return null;
}
