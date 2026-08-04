import { DocumentoColaboradorForm } from "@/components/documents/documento-colaborador-form";
import { loadCollaborator } from "../../collaborator-tabs";

export default async function NovoHoleritePage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { user } = await loadCollaborator(id, userId);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Enviar holerite</h1>
      <DocumentoColaboradorForm
        ownerUserId={user.id}
        ownerName={user.name}
        mode="payslip"
        redirectTo={`/admin/empresas/${id}/folha/${userId}/holerites`}
      />
    </div>
  );
}
