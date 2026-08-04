import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DocumentoLista } from "@/components/documents/documento-lista";
import { buttonPrimary } from "@/components/ui/styles";
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "../collaborator-tabs";

export default async function ColaboradorHoleritesPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  const documents = await prisma.document.findMany({
    where: { ownerUserId: userId, type: "PAYSLIP" },
    orderBy: [{ referenceMonth: "desc" }, { createdAt: "desc" }],
    include: { signature: { select: { signedAt: true } } },
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
        <Link
          href={`/admin/empresas/${id}/folha/${userId}/holerites/novo`}
          className={buttonPrimary}
        >
          Enviar holerite
        </Link>
      </div>

      <CollaboratorTabs companyId={id} userId={userId} active="holerites" />

      <DocumentoLista
        documents={documents}
        showReferenceMonth
        emptyMessage="Nenhum holerite enviado ainda."
      />
    </div>
  );
}
