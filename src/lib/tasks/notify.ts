/**
 * Para onde vai o aviso de cada atividade concluída. O endereço é o da conta
 * do BPO; `TASK_NOTIFY_EMAIL` permite trocar sem mexer no código.
 */
export function taskNotificationEmail(): string {
  return process.env.TASK_NOTIFY_EMAIL?.trim() || "dabliwbpo@gmail.com";
}
