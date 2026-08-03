import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NovoUsuarioForm } from "@/app/admin/usuarios/novo/novo-usuario-form";

export default async function NovaPessoaDaEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Nova pessoa em {company.name}</h1>
      <NovoUsuarioForm
        companies={[]}
        lockedCompany={{ id: company.id, name: company.name }}
        redirectTo={`/admin/empresas/${company.id}`}
      />
    </div>
  );
}
