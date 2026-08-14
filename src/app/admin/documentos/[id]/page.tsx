import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignatureProof } from "@/components/documents/signature-proof";
import { ResendEmailButton } from "@/components/documents/resend-email-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteDocumentAction } from "@/lib/actions/documents";

export default async function AdminDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { signature: true, owner: true, uploadedBy: true },
  });

  if (!document) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{document.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {document.fileName} · destinatário: {document.owner.name} ({document.owner.email}) ·
            enviado por {document.uploadedBy.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <DocumentStatusBadge status={document.status} />
          <ResendEmailButton documentId={document.id} recipientEmail={document.owner.email} />
        </div>
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

      <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
        <DeleteButton
          action={deleteDocumentAction}
          hidden={{ documentId: document.id, redirectTo: "/admin/documentos" }}
          question="Excluir este documento? O arquivo sai junto."
        />
      </div>
    </div>
  );
}
