import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { sendMonthlyTimeClockReminders } from "@/lib/time-clock-reminder";

// Dezenas de e-mails enviados em sequência passam dos 10 s padrão.
export const maxDuration = 300;

/**
 * Lembrete mensal do controle de ponto (vercel.json → crons, dia 1 de cada
 * mês). Idempotente: o registro de envios impede aviso em dobro.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await sendMonthlyTimeClockReminders();
  if (result.failed > 0) {
    console.warn("[cron] lembrete-ponto com falhas:", result);
  }
  return NextResponse.json(result);
}
