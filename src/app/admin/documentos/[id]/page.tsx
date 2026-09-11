import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignatureProof } from "@/components/documents/signature-proof";
import { ResendEmailButton } from "@/components/documents/resend-email-button";
import { RejectSignatureButton } from "@/components/documents/reject-signature-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteDocumentAction } from "@/lib/actions/documents";
import { APP_TIME_ZONE } from "@/lib/format";

function quando(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminDocumentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ recusa?: string }>;
}) {
  const { id } = await params;
  const { recusa } = await searchParams;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      signature: true,
      owner: true,
      uploadedBy: true,
      signatureRejections: {
        orderBy: { rejectedAt: "desc" },
        include: { rejectedBy: { select: { name: true } } },
      },
    },
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

      {recusa === "ok" && (
        <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Assinatura recusada. O documento voltou a aguardar assinatura e o pedido para assinar de
          novo foi enviado para {document.owner.email}.
        </div>
      )}
      {recusa === "sem-email" && (
        <div role="alert" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Assinatura recusada, mas o e-mail para {document.owner.email} não saiu. Use
          &ldquo;Reenviar e-mail&rdquo; para avisar a pessoa.
        </div>
      )}

      <div className="mt-6">
        <DocumentViewer
          fileUrl={`/api/documentos/${document.id}/arquivo`}
          mimeType={document.mimeType}
          fileName={document.fileName}
        />
      </div>

      {document.signature ? (
        <div className="mt-4 flex flex-col gap-3">
          <SignatureProof signature={document.signature} detailed auditUrl={document.auditFilePath ? `/api/documentos/${document.id}/arquivo?tipo=auditoria` : null} />
          <div className="flex justify-end">
            <RejectSignatureButton documentId={document.id} signerName={document.signature.signerName} />
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Ainda não assinado pelo destinatário.
        </div>
      )}

      {/* A prova do que foi recusado, e por quê: continua valendo depois da nova assinatura. */}
      {document.signatureRejections.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Assinaturas recusadas ({document.signatureRejections.length})
          </h2>
          <ul className="mt-2 flex flex-col gap-2">
            {document.signatureRejections.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div className="flex flex-wrap items-start gap-4">
                  {r.imageData && (
                    // eslint-disable-next-line @next/next/no-img-element -- inline data URL, no remote asset to optimize
                    <img
                      src={r.imageData}
                      alt={`Assinatura recusada de ${r.signerName}`}
                      className="h-14 w-40 rounded border border-slate-200 bg-slate-50 object-contain p-1"
                    />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-slate-900">
                      Assinada por {r.signerName} em {quando(r.signedAt)}
                    </p>
                    <p className="text-slate-600">
                      Recusada em {quando(r.rejectedAt)} por {r.rejectedBy.name}
                    </p>
                    <p className="text-slate-600">Motivo: {r.reason}</p>
                    <p className="text-xs text-slate-500">IP {r.ipAddress}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
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
