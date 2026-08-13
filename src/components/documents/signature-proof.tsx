import type { Signature } from "@prisma/client";

/**
 * The signature receipt shown on every document detail page. `detailed` adds
 * the audit fields that only staff (admin/RH) need to see.
 */
export function SignatureProof({
  signature,
  detailed = false,
  auditUrl = null,
}: {
  signature: Signature;
  detailed?: boolean;
  /** Link para o relatório de auditoria, quando já emitido. */
  auditUrl?: string | null;
}) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p className="font-medium">Prova de assinatura</p>

      {signature.imageData && (
        <figure className="mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL, no remote asset to optimize */}
          <img
            src={signature.imageData}
            alt={`Assinatura manuscrita de ${signature.signerName}`}
            className="h-24 w-full max-w-sm rounded-md border border-emerald-200 bg-white object-contain p-2"
          />
          <figcaption className="mt-1 text-xs text-emerald-800">
            Assinatura manuscrita capturada no ato da assinatura.
          </figcaption>
        </figure>
      )}

      <div className="mt-3">
        <p>Assinante: {signature.signerName}</p>
        <p>Data/hora: {signature.signedAt.toLocaleString("pt-BR")}</p>
        {detailed && (
          <>
            <p>IP: {signature.ipAddress}</p>
            <p>Navegador: {signature.userAgent}</p>
          </>
        )}
      </div>

      {auditUrl && (
        <p className="mt-3">
          <a
            href={auditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-emerald-700"
          >
            Abrir relatório de auditoria (PDF)
          </a>
        </p>
      )}
    </div>
  );
}
