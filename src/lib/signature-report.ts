import { createHash } from "node:crypto";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { APP_TIME_ZONE, gmtOffsetLabel } from "@/lib/format";

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

const INK = rgb(0.06, 0.09, 0.16);
const MUTED = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.87, 0.9);
const PANEL = rgb(0.96, 0.97, 0.98);

export type SignatureReportInput = {
  documentId: string;
  documentTitle: string;
  fileName: string;
  fileHash: string;
  uploadedByName: string;
  uploadedAt: Date;
  companyName: string;
  companyLogo: { bytes: Uint8Array; type: "png" | "jpg" } | null;
  signer: {
    name: string;
    cpf: string | null;
    email: string;
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
    signatureImage: string | null;
  };
};

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Datas do relatório saem no horário oficial de Brasília. */
function stamp(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Quebra o texto para caber na largura dada, para o user agent não vazar da página. */
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
 * The audit report appended after a document is signed: who signed, when, from
 * where, and the hash that ties the report to that exact file. Modelled on the
 * Autentique report the client uses today.
 */
export async function buildSignatureReport(input: SignatureReportInput): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const page: PDFPage = pdf.addPage(A4);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const { width, height } = page.getSize();
  const contentWidth = width - MARGIN * 2;
  let y = height - MARGIN;

  // ---- cabeçalho: logo da empresa à esquerda, identificação à direita ----
  if (input.companyLogo) {
    try {
      const image =
        input.companyLogo.type === "png"
          ? await pdf.embedPng(input.companyLogo.bytes)
          : await pdf.embedJpg(input.companyLogo.bytes);
      const scaled = image.scaleToFit(150, 44);
      page.drawImage(image, {
        x: MARGIN,
        y: y - scaled.height,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {
      // Logo ilegível não pode impedir a emissão do comprovante.
      page.drawText(input.companyName, { x: MARGIN, y: y - 14, size: 12, font: bold, color: INK });
    }
  } else {
    page.drawText(input.companyName, { x: MARGIN, y: y - 14, size: 12, font: bold, color: INK });
  }

  const headerLines = [
    `Identificador: ${input.documentId}`,
    `Data/Hora em ${gmtOffsetLabel(input.signer.signedAt)} (Brasília)`,
    `Autenticação eletrônica por ${input.companyName}`,
  ];
  headerLines.forEach((line, i) => {
    const size = i === 0 ? 8.5 : 8;
    const font = i === 0 ? bold : regular;
    page.drawText(line, {
      x: width - MARGIN - font.widthOfTextAtSize(line, size),
      y: y - 10 - i * 11,
      size,
      font,
      color: i === 0 ? INK : MUTED,
    });
  });

  y -= 78;

  page.drawText("Relatório de auditoria e validação de assinatura eletrônica", {
    x: MARGIN,
    y,
    size: 15,
    font: bold,
    color: INK,
  });
  y -= 30;

  // ---- painel de integridade ----
  const panelHeight = 96;
  page.drawRectangle({
    x: MARGIN,
    y: y - panelHeight,
    width: contentWidth,
    height: panelHeight,
    color: PANEL,
  });

  let panelY = y - 18;
  page.drawText("Documento", { x: MARGIN + 14, y: panelY, size: 8, font: bold, color: MUTED });
  panelY -= 13;
  page.drawText(`${input.documentTitle} — ${input.fileName}`, {
    x: MARGIN + 14,
    y: panelY,
    size: 10,
    font: regular,
    color: INK,
  });
  panelY -= 20;
  page.drawText("Hash SHA-256 do arquivo original", {
    x: MARGIN + 14,
    y: panelY,
    size: 8,
    font: bold,
    color: MUTED,
  });
  panelY -= 12;
  page.drawText(input.fileHash.slice(0, 32), { x: MARGIN + 14, y: panelY, size: 8, font: mono, color: INK });
  panelY -= 10;
  page.drawText(input.fileHash.slice(32), { x: MARGIN + 14, y: panelY, size: 8, font: mono, color: INK });
  panelY -= 16;
  page.drawText("Assinaturas concluídas: 1 de 1", {
    x: MARGIN + 14,
    y: panelY,
    size: 9,
    font: bold,
    color: INK,
  });

  y -= panelHeight + 26;

  // ---- assinatura ----
  page.drawText("Assinatura presente no documento", {
    x: MARGIN,
    y,
    size: 8.5,
    font: bold,
    color: MUTED,
  });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.7,
    color: RULE,
  });
  y -= 76;

  if (input.signer.signatureImage) {
    try {
      const base64 = input.signer.signatureImage.split(",")[1] ?? "";
      const image = await pdf.embedPng(Buffer.from(base64, "base64"));
      const scaled = image.scaleToFit(190, 56);
      page.drawImage(image, { x: MARGIN, y: y + 6, width: scaled.width, height: scaled.height });
    } catch {
      // segue sem o traço; os dados abaixo continuam valendo
    }
  }

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: MARGIN + 210, y },
    thickness: 0.8,
    color: INK,
  });
  y -= 14;

  page.drawText(input.signer.name, { x: MARGIN, y, size: 10.5, font: bold, color: INK });
  y -= 13;
  if (input.signer.cpf) {
    page.drawText(`CPF ${input.signer.cpf}`, { x: MARGIN, y, size: 9.5, font: regular, color: INK });
    y -= 13;
  }
  page.drawText("Signatário", { x: MARGIN, y, size: 9.5, font: regular, color: MUTED });

  y -= 34;

  // ---- trilha de auditoria ----
  page.drawText("Trilha de auditoria", { x: MARGIN, y, size: 8.5, font: bold, color: MUTED });
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.7,
    color: RULE,
  });
  y -= 22;

  const events: { when: Date; who: string; what: string; details: string[] }[] = [
    {
      when: input.uploadedAt,
      who: input.uploadedByName,
      what: "disponibilizou o documento",
      details: [`Hash SHA-256 do arquivo: ${input.fileHash}`],
    },
    {
      when: input.signer.signedAt,
      who: `${input.signer.name} (${input.signer.email}${input.signer.cpf ? `, CPF ${input.signer.cpf}` : ""})`,
      what: "assinou o documento com assinatura manuscrita",
      details: [
        `Endereço de IP: ${input.signer.ipAddress}`,
        `Navegador: ${input.signer.userAgent}`,
      ],
    },
  ];

  for (const event of events) {
    page.drawText(stamp(event.when), { x: MARGIN, y, size: 8, font: regular, color: MUTED });
    for (const line of wrap(`${event.who} ${event.what}`, bold, 9.5, contentWidth - 96)) {
      page.drawText(line, { x: MARGIN + 96, y, size: 9.5, font: bold, color: INK });
      y -= 12;
    }
    y -= 2;
    for (const detail of event.details) {
      for (const line of wrap(detail, mono, 7.5, contentWidth - 108)) {
        page.drawText(line, { x: MARGIN + 106, y, size: 7.5, font: mono, color: MUTED });
        y -= 10;
      }
    }
    y -= 16;
  }

  // ---- rodapé ----
  const footer =
    "Para conferir a integridade, gere o hash SHA-256 do arquivo original e compare com o valor acima.";
  page.drawLine({
    start: { x: MARGIN, y: MARGIN + 24 },
    end: { x: width - MARGIN, y: MARGIN + 24 },
    thickness: 0.7,
    color: RULE,
  });
  page.drawText(footer, { x: MARGIN, y: MARGIN + 10, size: 7.5, font: regular, color: MUTED });
  page.drawText(input.documentId, {
    x: width - MARGIN - mono.widthOfTextAtSize(input.documentId, 7.5),
    y: MARGIN + 10,
    size: 7.5,
    font: mono,
    color: MUTED,
  });

  return Buffer.from(await pdf.save());
}
