import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { APP_TIME_ZONE, formatCents } from "@/lib/format";
import { centsToWords } from "@/lib/valor-extenso";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.8, 0.83, 0.87);

export type ReceiptPdfInput = {
  companyName: string;
  companyCnpj: string | null;
  companyCity: string | null;
  companyState: string | null;
  companyLogo: { bytes: Uint8Array; type: "png" | "jpg" } | null;
  collaboratorName: string;
  collaboratorCpf: string | null;
  description: string;
  amountCents: number;
  issuedAt: Date;
};

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A via do recibo que segue para assinatura. Os dados são gravados no PDF no
 * momento do envio: a partir daí o valor e a descrição não mudam mais, porque
 * é este arquivo que o colaborador assina e cujo hash entra na auditoria.
 */
export async function buildReceiptPdf(input: ReceiptPdfInput): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage(A4);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const contentWidth = width - MARGIN * 2;
  let y = height - MARGIN;

  if (input.companyLogo) {
    try {
      const image =
        input.companyLogo.type === "png"
          ? await pdf.embedPng(input.companyLogo.bytes)
          : await pdf.embedJpg(input.companyLogo.bytes);
      const scaled = image.scaleToFit(130, 46);
      page.drawImage(image, {
        x: MARGIN,
        y: y - scaled.height,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {
      // segue sem a logo
    }
  }

  page.drawText("RECIBO DE PAGAMENTO", {
    x: width - MARGIN - bold.widthOfTextAtSize("RECIBO DE PAGAMENTO", 11),
    y: y - 12,
    size: 11,
    font: bold,
    color: MUTED,
  });
  const amount = formatCents(input.amountCents);
  page.drawText(amount, {
    x: width - MARGIN - bold.widthOfTextAtSize(amount, 22),
    y: y - 38,
    size: 22,
    font: bold,
    color: INK,
  });

  y -= 62;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: RULE,
  });
  y -= 12;

  page.drawText(input.companyName, { x: MARGIN, y, size: 10, font: bold, color: INK });
  if (input.companyCnpj) {
    y -= 13;
    page.drawText(`CNPJ ${input.companyCnpj}`, { x: MARGIN, y, size: 9, font: regular, color: MUTED });
  }

  y -= 44;

  const sentence =
    `Recebi de ${input.companyName}` +
    (input.companyCnpj ? `, inscrita no CNPJ sob o nº ${input.companyCnpj}` : "") +
    `, a importância de ${amount} (${centsToWords(input.amountCents)}), referente a ` +
    `${input.description}, dando plena e geral quitação pelo valor recebido.`;

  for (const line of wrap(sentence, regular, 11.5, contentWidth)) {
    page.drawText(line, { x: MARGIN, y, size: 11.5, font: regular, color: INK });
    y -= 19;
  }

  y -= 26;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.7,
    color: RULE,
  });
  y -= 20;

  page.drawText("RECEBEDOR", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  page.drawText("CPF", { x: MARGIN + contentWidth / 2, y, size: 8, font: bold, color: MUTED });
  y -= 15;
  page.drawText(input.collaboratorName, { x: MARGIN, y, size: 11, font: bold, color: INK });
  page.drawText(input.collaboratorCpf ?? "Não informado", {
    x: MARGIN + contentWidth / 2,
    y,
    size: 11,
    font: bold,
    color: INK,
  });

  y -= 18;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.7,
    color: RULE,
  });

  y -= 34;
  const place = input.companyCity
    ? `${input.companyCity}${input.companyState ? `/${input.companyState}` : ""}, `
    : "";
  const issued = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(input.issuedAt);
  page.drawText(`${place}${issued}.`, { x: MARGIN, y, size: 10.5, font: regular, color: INK });

  page.drawText(
    "Assinado eletronicamente pelo recebedor no portal. A trilha de auditoria acompanha este recibo.",
    { x: MARGIN, y: MARGIN, size: 8, font: regular, color: MUTED }
  );

  return Buffer.from(await pdf.save());
}
