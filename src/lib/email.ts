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

export async function sendDocumentUploadedEmail({
  to,
  recipientName,
  documentTitle,
}: {
  to: string;
  recipientName: string;
  documentTitle: string;
}): Promise<void> {
  const client = getTransporter();
  if (!client) {
    console.warn(
      "[email] GMAIL_USER/GMAIL_APP_PASSWORD não configurados; notificação de documento não enviada."
    );
    return;
  }

  try {
    await client.sendMail({
      from: `"Portal de Documentos" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Novo documento disponível: ${documentTitle}`,
      text: `Olá, ${recipientName}.\n\nUm novo documento ("${documentTitle}") foi disponibilizado para você no Portal de Documentos.\n\nAcesse o portal para visualizar.`,
      html: `<p>Olá, ${recipientName}.</p><p>Um novo documento (<strong>${documentTitle}</strong>) foi disponibilizado para você no Portal de Documentos.</p><p>Acesse o portal para visualizar.</p>`,
    });
  } catch (error) {
    console.error("[email] Falha ao enviar notificação de documento:", error);
  }
}
