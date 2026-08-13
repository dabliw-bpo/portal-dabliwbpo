import { CadastroColaboradorForm } from "./cadastro-colaborador-form";

/** Datas são gravadas à meia-noite UTC, então a parte ISO é a data local. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "./collaborator-tabs";

export default async function ColaboradorCadastroPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  return (
    <div>
      <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
      <CollaboratorTabs companyId={id} userId={userId} active="cadastro" />
      <CadastroColaboradorForm
        userId={user.id}
        companyId={id}
        values={{
          name: user.name,
          email: user.email,
          whatsapp: user.whatsapp ?? "",
          role: user.role,
          active: user.active,
          cpf: user.cpf ?? "",
          admissionDate: toDateInput(user.admissionDate),
          birthDate: toDateInput(user.birthDate),
        }}
      />
    </div>
  );
}
