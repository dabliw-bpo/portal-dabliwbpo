import Link from "next/link";
import type { DocumentStatus, Signature } from "@prisma/client";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { DocumentViewer } from "@/components/documents/document-viewer";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { SignDocumentModal } from "@/components/documents/sign-document-modal";
import { SignatureProof } from "@/components/documents/signature-proof";
import { Sobrelinha } from "./sobrelinha";

/**
 * A tela de um documento nos portais do colaborador e do cliente. Assinar vem
 * antes do visualizador: o PDF é alto, e no celular o botão ficaria várias
 * telas abaixo.
 */
export function DocumentoDetalhe({
  voltar,
  documento,
  arquivoUrl,
  assinante,
  recusaAnterior,
}: {
  voltar: { href: string; rotulo: string };
  documento: {
    id: string;
    title: string;
    status: DocumentStatus;
    mimeType: string;
    fileName: string;
    enviadoEm: string;
    auditFilePath: string | null;
    signature: Signature | null;
  };
  arquivoUrl: string;
  assinante: string;
  /** Motivo da última recusa, quando o documento voltou a esperar assinatura. */
  recusaAnterior: string | null;
}) {
  const auditUrl = documento.auditFilePath
    ? `/api/documentos/${documento.id}/arquivo?tipo=auditoria`
    : null;

  return (
    <div>
      <Link
        href={voltar.href}
        className="group inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-areia transition-colors hover:text-ouro"
      >
        <ArrowLeft
          size={14}
          aria-hidden
          className="transition-transform group-hover:-translate-x-1 motion-reduce:transition-none"
        />
        {voltar.rotulo}
      </Link>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          <Sobrelinha>Enviado em {documento.enviadoEm}</Sobrelinha>
          <h1 className="mt-4 font-serifa text-4xl font-medium leading-[1.08] text-marfim sm:text-5xl">
            {documento.title}
          </h1>
        </div>
        {documento.status !== "PENDING_SIGNATURE" && <DocumentStatusBadge status={documento.status} />}
      </div>

      {documento.signature ? (
        <div className="mt-10">
          <SignatureProof signature={documento.signature} auditUrl={auditUrl} />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-5 border border-ouro/35 bg-ouro/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="font-serifa text-2xl leading-snug text-marfim">
              Este documento aguarda a sua assinatura.
            </p>
            {recusaAnterior ? (
              <p className="mt-1.5 text-sm text-areia">
                A assinatura anterior foi recusada:{" "}
                <span className="text-ouro-claro">{recusaAnterior}</span>. Assine novamente.
              </p>
            ) : (
              <p className="mt-1.5 text-sm text-areia">Leia até o fim e assine quando estiver de acordo.</p>
            )}
          </div>
          <SignDocumentModal documentId={documento.id} signerName={assinante} />
        </div>
      )}

      <div className="mt-8">
        <DocumentViewer fileUrl={arquivoUrl} mimeType={documento.mimeType} fileName={documento.fileName} />
      </div>
    </div>
  );
}
