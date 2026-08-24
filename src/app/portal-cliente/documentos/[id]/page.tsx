import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignDocumentModal } from "@/components/documents/sign-document-modal";
import { SignatureProof } from "@/components/documents/signature-proof";

export default async function ClienteDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: { signature: true },
  });

  if (!document || document.ownerUserId !== session.user.id) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{document.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{document.fileName}</p>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      {/* Mesma ordem do portal do colaborador: assinar primeiro, ler depois. */}
      {document.signature ? (
        <div className="mt-6">
          <SignatureProof signature={document.signature} auditUrl={document.auditFilePath ? `/api/documentos/${document.id}/arquivo?tipo=auditoria` : null} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-emerald-900">
            Este documento está aguardando a sua assinatura.
          </p>
          <SignDocumentModal documentId={document.id} signerName={session.user.name ?? ""} />
        </div>
      )}

      <div className="mt-6">
        <DocumentViewer
          fileUrl={`/api/documentos/${document.id}/arquivo`}
          mimeType={document.mimeType}
          fileName={document.fileName}
        />
      </div>
    </div>
  );
}
