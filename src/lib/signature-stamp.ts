import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { APP_TIME_ZONE } from "@/lib/format";

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.55, 0.58, 0.63);

/**
 * O campo de assinatura do recibo, em coordenadas fixas a partir da base da
 * página. O gerador desenha a linha vazia e o carimbo escreve a rubrica em
 * cima dela — as duas etapas precisam concordar sobre o lugar, então os
 * números moram num arquivo só.
 */
export const RECEIPT_SIGNATURE_FIELD = {
  x: 56,
  lineY: 300,
  lineWidth: 260,
  imageMaxWidth: 230,
  imageMaxHeight: 58,
} as const;

export type SignatureStamp = {
  /** Data URL de PNG, como o `SignaturePad` grava. */
  imageData: string;
  signerName: string;
  signedAt: Date;
};

function formatSignedAt(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Devolve uma cópia do recibo com a assinatura manuscrita desenhada no campo.
 *
 * O arquivo original nunca é alterado: é dele que sai o `fileHash` gravado no
 * relatório de auditoria, e é ele que prova *qual* documento a pessoa assinou.
 * Reescrevê-lo invalidaria essa prova justamente no momento em que ela passa a
 * valer.
 *
 * `drawField` desenha também a linha e o rótulo, para os recibos emitidos
 * antes de o campo existir no gerador.
 */
export async function stampSignatureOnReceipt(
  original: Uint8Array,
  stamp: SignatureStamp,
  { drawField = false }: { drawField?: boolean } = {}
): Promise<Buffer> {
  const pdf = await PDFDocument.load(original);
  const page = pdf.getPage(0);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const field = RECEIPT_SIGNATURE_FIELD;

  if (drawField) {
    page.drawLine({
      start: { x: field.x, y: field.lineY },
      end: { x: field.x + field.lineWidth, y: field.lineY },
      thickness: 0.8,
      color: RULE,
    });
    page.drawText("ASSINATURA DO RECEBEDOR", {
      x: field.x,
      y: field.lineY - 14,
      size: 8,
      font: bold,
      color: MUTED,
    });
    page.drawText(stamp.signerName, {
      x: field.x,
      y: field.lineY - 29,
      size: 10.5,
      font: regular,
      color: INK,
    });
  }

  const base64 = stamp.imageData.split(",")[1] ?? "";
  if (base64) {
    const image = await pdf.embedPng(Buffer.from(base64, "base64"));
    const scaled = image.scaleToFit(field.imageMaxWidth, field.imageMaxHeight);
    page.drawImage(image, {
      x: field.x,
      y: field.lineY + 5,
      width: scaled.width,
      height: scaled.height,
    });
  }

  page.drawText(`Assinado eletronicamente em ${formatSignedAt(stamp.signedAt)}.`, {
    x: field.x,
    y: field.lineY - 45,
    size: 8,
    font: regular,
    color: MUTED,
  });

  return Buffer.from(await pdf.save());
}
