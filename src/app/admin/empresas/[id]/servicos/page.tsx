import { redirect } from "next/navigation";

/**
 * A contratação de serviços passou para a aba Gestão de Tarefas da empresa.
 * A rota antiga fica só para não quebrar link salvo.
 */
export default async function EmpresaServicosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/empresas/${id}/tarefas`);
}
