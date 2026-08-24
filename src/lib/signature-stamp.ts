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

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;

export type SignaturePageInput = SignatureStamp & {
  documentTitle: string;
  fileName: string;
  signerCpf: string | null;
  companyName: string;
  companyLogo: { bytes: Uint8Array; type: "png" | "jpg" } | null;
};

/**
 * Acrescenta uma página de assinatura ao final do documento.
 *
 * Para holerite e afins não dá para carimbar a rubrica no corpo: o arquivo vem
 * pronto de fora e não há como saber onde sobra espaço — desenhar às cegas
 * pode cair em cima de um valor. Uma página no fim resolve sem tocar em nada
 * do que já estava lá.
 *
 * Como no recibo, o retorno é um arquivo novo. O original continua sendo o que
 * o `fileHash` do relatório de auditoria atesta.
 */
export async function appendSignaturePage(
  original: Uint8Array,
  input: SignaturePageInput
): Promise<Buffer> {
  const pdf = await PDFDocument.load(original);
  const page = pdf.addPage(A4);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - MARGIN;

  if (input.companyLogo) {
    try {
      const image =
        input.companyLogo.type === "png"
          ? await pdf.embedPng(input.companyLogo.bytes)
          : await pdf.embedJpg(input.companyLogo.bytes);
      const scaled = image.scaleToFit(120, 42);
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

  const titulo = "ASSINATURA ELETRÔNICA";
  page.drawText(titulo, {
    x: width - MARGIN - bold.widthOfTextAtSize(titulo, 11),
    y: y - 12,
    size: 11,
    font: bold,
    color: MUTED,
  });

  y -= 58;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 1,
    color: RULE,
  });

  y -= 20;
  page.drawText(input.companyName, { x: MARGIN, y, size: 10, font: bold, color: INK });

  y -= 34;
  page.drawText("DOCUMENTO ASSINADO", { x: MARGIN, y, size: 8, font: bold, color: MUTED });
  y -= 15;
  page.drawText(input.documentTitle, { x: MARGIN, y, size: 11.5, font: bold, color: INK });
  y -= 15;
  page.drawText(input.fileName, { x: MARGIN, y, size: 9, font: regular, color: MUTED });

  // O campo, na mesma proporção do que existe no recibo.
  const lineY = 430;
  const base64 = input.imageData.split(",")[1] ?? "";
  if (base64) {
    const image = await pdf.embedPng(Buffer.from(base64, "base64"));
    const scaled = image.scaleToFit(
      RECEIPT_SIGNATURE_FIELD.imageMaxWidth,
      RECEIPT_SIGNATURE_FIELD.imageMaxHeight
    );
    page.drawImage(image, {
      x: MARGIN,
      y: lineY + 5,
      width: scaled.width,
      height: scaled.height,
    });
  }

  page.drawLine({
    start: { x: MARGIN, y: lineY },
    end: { x: MARGIN + RECEIPT_SIGNATURE_FIELD.lineWidth, y: lineY },
    thickness: 0.8,
    color: RULE,
  });

  let sy = lineY - 14;
  page.drawText("ASSINATURA DO TITULAR", { x: MARGIN, y: sy, size: 8, font: bold, color: MUTED });
  sy -= 15;
  page.drawText(input.signerName, { x: MARGIN, y: sy, size: 11, font: bold, color: INK });
  if (input.signerCpf) {
    sy -= 14;
    page.drawText(`CPF ${input.signerCpf}`, { x: MARGIN, y: sy, size: 9.5, font: regular, color: MUTED });
  }
  sy -= 18;
  page.drawText(`Assinado eletronicamente em ${formatSignedAt(input.signedAt)}.`, {
    x: MARGIN,
    y: sy,
    size: 9,
    font: regular,
    color: INK,
  });

  page.drawText(
    "Esta página integra o documento assinado. O relatório de auditoria, com IP, dispositivo e hash do arquivo, acompanha este arquivo no portal.",
    { x: MARGIN, y: MARGIN, size: 8, font: regular, color: MUTED }
  );

  return Buffer.from(await pdf.save());
}
