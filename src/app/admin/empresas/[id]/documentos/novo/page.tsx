import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NovoDocumentoForm } from "@/components/documents/novo-documento-form";

export default async function NovoDocumentoDaEmpresaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    notFound();
  }

  const owners = await prisma.user.findMany({
    where: { companyId: id, role: { in: ["CLIENT", "COLLABORATOR"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Novo documento em {company.name}</h1>
      <NovoDocumentoForm owners={owners} redirectTo={`/admin/empresas/${id}/documentos`} />
    </div>
  );
}
