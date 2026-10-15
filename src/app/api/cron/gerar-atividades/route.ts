import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { generateTasks } from "@/lib/tasks/generate";

// A geração de uma carteira grande passa dos 10 s padrão na primeira rodada.
export const maxDuration = 300;

/**
 * Geração diária das atividades recorrentes (vercel.json → crons). A Vercel
 * chama esta rota com `Authorization: Bearer $CRON_SECRET`. Idempotente: rodar
 * de novo no mesmo dia não duplica nada (unique contrato + período).
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
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
