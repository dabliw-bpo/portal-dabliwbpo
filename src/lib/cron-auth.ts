import { timingSafeEqual } from "node:crypto";

/**
 * Autoriza a chamada de um agendamento da Vercel: ela manda
 * `Authorization: Bearer $CRON_SECRET`. Sem o segredo configurado a rota fica
 * fechada para todo mundo, em vez de aberta; a comparação é de tempo constante.
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return received.length === expected.length && timingSafeEqual(received, expected);
}
