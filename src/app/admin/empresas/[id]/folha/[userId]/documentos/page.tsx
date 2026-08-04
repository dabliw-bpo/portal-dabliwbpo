import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DocumentoLista } from "@/components/documents/documento-lista";
import { buttonPrimary } from "@/components/ui/styles";
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "../collaborator-tabs";

export default async function ColaboradorDocumentosPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  // Payslips and vacation papers have their own tabs; everything else lands here.
  const documents = await prisma.document.findMany({
    where: { ownerUserId: userId, type: { in: ["CONTRACT", "OTHER"] } },
    orderBy: { createdAt: "desc" },
    include: { signature: { select: { signedAt: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
        <Link
          href={`/admin/empresas/${id}/folha/${userId}/documentos/novo`}
          className={buttonPrimary}
        >
          Enviar documento
        </Link>
      </div>

      <CollaboratorTabs companyId={id} userId={userId} active="documentos" />

      <DocumentoLista documents={documents} emptyMessage="Nenhum documento enviado ainda." />
    </div>
  );
}
