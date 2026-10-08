import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { generateTasks } from "@/lib/tasks/generate";

// A geração de uma carteira grande passa dos 10 s padrão na primeira rodada.
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // Sem segredo configurado a rota fica fechada para todo mundo, em vez de aberta.
  if (!secret) return false;

  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/**
 * Geração diária das atividades recorrentes (vercel.json → crons). A Vercel
 * chama esta rota com `Authorization: Bearer $CRON_SECRET`. Idempotente: rodar
 * de novo no mesmo dia não duplica nada (unique contrato + período).
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await generateTasks();
  if (result.errors.length > 0) {
    console.warn("[cron] gerar-atividades com avisos:", result.errors);
  }

  return NextResponse.json({
    runId: result.runId,
    criadas: result.tasksCreated,
    puladas: result.tasksSkipped,
    avisos: result.errors,
  });
}
