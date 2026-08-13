import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Attachments ride along inside the upload request, so a large one delays the
 * response and risks the serverless time limit. Past this size the document
 * goes out as a link only, which the body explains.
 */
export const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type DocumentEmailInput = {
  to: string;
  recipientName: string;
  documentTitle: string;
  documentUrl?: string;
  attachment?: { filename: string; content: Buffer; contentType: string };
};

/**
 * Builds the message. Kept separate from sending so the attachment cap, the
 * link and the escaping can be exercised without a network round trip.
 */
export function buildDocumentUploadedEmail(input: DocumentEmailInput) {
  const { to, recipientName, documentTitle, documentUrl, attachment } = input;

  const attach =
    attachment && attachment.content.byteLength <= MAX_EMAIL_ATTACHMENT_BYTES
      ? attachment
      : undefined;

  if (attachment && !attach) {
    console.warn(
      `[email] Anexo de ${attachment.content.byteLength} bytes acima do limite; enviando apenas o link.`
    );
  }

  const safeName = escapeHtml(recipientName);
  const safeTitle = escapeHtml(documentTitle);

  const copyLine = attach
    ? "Uma cópia está anexada a este e-mail."
    : "O documento está disponível no portal.";

  const signLine = documentUrl
    ? "Para concluir, você ainda precisa assiná-lo no portal."
    : "Acesse o portal para visualizar e assinar.";

  const textParts = [
    `Olá, ${recipientName}.`,
    `Um novo documento ("${documentTitle}") foi disponibilizado para você no Portal de Documentos.`,
    copyLine,
    signLine,
  ];
  if (documentUrl) {
    textParts.push(documentUrl);
  }

  return {
    from: `"Portal de Documentos" <${process.env.GMAIL_USER}>`,
    to,
    encoding: "base64" as const,
    subject: `Novo documento disponível: ${documentTitle}`,
    text: textParts.join("\n\n"),
    html: [
      `<p>Olá, ${safeName}.</p>`,
      `<p>Um novo documento (<strong>${safeTitle}</strong>) foi disponibilizado para você no Portal de Documentos.</p>`,
      `<p>${copyLine}</p>`,
      `<p>${signLine}</p>`,
      documentUrl
        ? `<p><a href="${escapeHtml(documentUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 18px;border-radius:6px;text-decoration:none">Abrir e assinar no portal</a></p>`
        : "",
    ].join(""),
    attachments: attach ? [attach] : undefined,
  };
}

export type SendResult = { ok: true } | { ok: false; error: string };

/**
 * Never throws: an upload must not fail because the mail server did. Callers
 * that need to tell the user what happened (the resend button) read the
 * result. Note that `ok` means the message was accepted by Gmail, not that it
 * was delivered — bounces arrive separately.
 */
export async function sendDocumentUploadedEmail(input: DocumentEmailInput): Promise<SendResult> {
  const client = getTransporter();
  if (!client) {
    const error = "GMAIL_USER/GMAIL_APP_PASSWORD não configurados.";
    console.warn(`[email] ${error} Notificação de documento não enviada.`);
    return { ok: false, error };
  }

  try {
    await client.sendMail(buildDocumentUploadedEmail(input));
    return { ok: true };
  } catch (error) {
    console.error("[email] Falha ao enviar notificação de documento:", error);
    return { ok: false, error: (error as Error).message };
  }
}

export async function sendSignatureReceiptEmail({
  to,
  partnerName,
  signerName,
  documentTitle,
  signedAt,
  attachments,
}: {
  to: string;
  partnerName: string | null;
  signerName: string;
  documentTitle: string;
  signedAt: Date;
  attachments: { filename: string; content: Buffer; contentType: string }[];
}): Promise<SendResult> {
  const client = getTransporter();
  if (!client) {
    const error = "GMAIL_USER/GMAIL_APP_PASSWORD não configurados.";
    console.warn(`[email] ${error} Comprovante de assinatura não enviado.`);
    return { ok: false, error };
  }

  const when = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    dateStyle: "short",
    timeStyle: "short",
  }).format(signedAt);

  const greeting = partnerName ? `Olá, ${escapeHtml(partnerName)}.` : "Olá.";

  try {
    await client.sendMail({
      from: `"Portal de Documentos" <${process.env.GMAIL_USER}>`,
      to,
      encoding: "base64",
      subject: `Assinatura concluída: ${documentTitle} — ${signerName}`,
      text: [
        partnerName ? `Olá, ${partnerName}.` : "Olá.",
        `${signerName} assinou o documento "${documentTitle}" em ${when}.`,
        "Seguem em anexo o documento assinado e o relatório de auditoria com os dados da assinatura.",
      ].join("\n\n"),
      html: [
        `<p>${greeting}</p>`,
        `<p><strong>${escapeHtml(signerName)}</strong> assinou o documento <strong>${escapeHtml(documentTitle)}</strong> em ${when}.</p>`,
        `<p>Seguem em anexo o documento assinado e o relatório de auditoria com os dados da assinatura.</p>`,
      ].join(""),
      attachments,
    });
    return { ok: true };
  } catch (error) {
    console.error("[email] Falha ao enviar comprovante de assinatura:", error);
    return { ok: false, error: (error as Error).message };
  }
}

export async function sendBirthdayEmail({
  to,
  recipientName,
  companyName,
}: {
  to: string;
  recipientName: string;
  companyName: string | null;
}): Promise<SendResult> {
  const client = getTransporter();
  if (!client) {
    const error = "GMAIL_USER/GMAIL_APP_PASSWORD não configurados.";
    console.warn(`[email] ${error} Parabéns não enviado.`);
    return { ok: false, error };
  }

  const firstName = recipientName.trim().split(/\s+/)[0] ?? recipientName;
  const from = companyName ? `A equipe da ${companyName}` : "A equipe";
  const safeFrom = escapeHtml(from);

  try {
    await client.sendMail({
      from: `"Portal de Documentos" <${process.env.GMAIL_USER}>`,
      to,
      encoding: "base64",
      subject: `Feliz aniversário, ${firstName}! 🎉`,
      text: `Feliz aniversário, ${firstName}!\n\n${from} deseja um dia muito feliz e um ano novo de vida cheio de conquistas.\n\nUm abraço!`,
      html: [
        `<p style="font-size:18px"><strong>Feliz aniversário, ${escapeHtml(firstName)}! 🎉</strong></p>`,
        `<p>${safeFrom} deseja um dia muito feliz e um ano novo de vida cheio de conquistas.</p>`,
        `<p>Um abraço!</p>`,
      ].join(""),
    });
    return { ok: true };
  } catch (error) {
    console.error("[email] Falha ao enviar parabéns:", error);
    return { ok: false, error: (error as Error).message };
  }
}

export async function sendPasswordResetEmail({
  to,
  recipientName,
  resetUrl,
}: {
  to: string;
  recipientName: string;
  resetUrl: string;
}): Promise<void> {
  const client = getTransporter();
  if (!client) {
    console.warn(
      "[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados; e-mail de redefinição de senha não enviado."
    );
    return;
  }

  try {
    await client.sendMail({
      from: `"Portal de Documentos" <${process.env.GMAIL_USER}>`,
      to,
      encoding: "base64",
      subject: "Redefinição de senha - Portal de Documentos",
      text: `Olá, ${recipientName}.\n\nRecebemos um pedido para redefinir sua senha no Portal de Documentos.\n\nAcesse o link abaixo para escolher uma nova senha (válido por 1 hora):\n${resetUrl}\n\nSe você não pediu isso, pode ignorar este e-mail com seguranca.`,
      html: `<p>Olá, ${recipientName}.</p><p>Recebemos um pedido para redefinir sua senha no Portal de Documentos.</p><p><a href="${resetUrl}">Clique aqui para escolher uma nova senha</a> (válido por 1 hora).</p><p>Se você não pediu isso, pode ignorar este e-mail com segurança.</p>`,
    });
  } catch (error) {
    console.error("[email] Falha ao enviar e-mail de redefinição de senha:", error);
  }
}
