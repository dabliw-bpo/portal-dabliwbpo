import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignDocumentModal } from "@/components/documents/sign-document-modal";

export default async function ClienteDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const document = await prisma.document.findUnique({
    where: { id },
    include: { signature: true },
  });

  if (!document || document.ownerUserId !== session!.user.id) {
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

      <div className="mt-6">
        <DocumentViewer
          fileUrl={`/api/documentos/${document.id}/arquivo`}
          mimeType={document.mimeType}
          fileName={document.fileName}
        />
      </div>

      {document.signature ? (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Assinado por {document.signature.signerName} em{" "}
          {document.signature.signedAt.toLocaleString("pt-BR")} (IP {document.signature.ipAddress})
        </div>
      ) : (
        <div className="mt-4">
          <SignDocumentModal documentId={document.id} signerName={session!.user.name ?? ""} />
        </div>
      )}
    </div>
  );
}
