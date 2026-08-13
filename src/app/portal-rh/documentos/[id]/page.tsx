import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignatureProof } from "@/components/documents/signature-proof";

export default async function PortalRhDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { signature: true, owner: true, uploadedBy: true },
  });

  if (!document || document.owner.companyId !== session.user.companyId) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{document.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {document.fileName} · destinatário: {document.owner.name} · enviado por{" "}
            {document.uploadedBy.name}
          </p>
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
        <div className="mt-4">
          <SignatureProof signature={document.signature} detailed auditUrl={document.auditFilePath ? `/api/documentos/${document.id}/arquivo?tipo=auditoria` : null} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Ainda não assinado pelo destinatário.
        </div>
      )}
    </div>
  );
}
