import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";

export default async function PortalClientePage() {
  const session = await auth();
  const documents = await prisma.document.findMany({
    where: { ownerUserId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Meus documentos</h1>
      <DocumentList documents={documents} basePath="/portal-cliente/documentos" />
    </div>
  );
}
