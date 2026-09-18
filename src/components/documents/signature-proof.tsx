import type { Signature } from "@prisma/client";
import { APP_TIME_ZONE } from "@/lib/format";

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
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 portal:rounded-none portal:border-fio-forte portal:bg-cartao portal:p-6 portal:text-areia">
      <p className="font-medium portal:text-[12px] portal:uppercase portal:tracking-[0.22em] portal:text-salvia">
        Prova de assinatura
      </p>

      {signature.imageData && (
        <figure className="mt-3 portal:mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- inline data URL, no remote asset to optimize */}
          <img
            src={signature.imageData}
            alt={`Assinatura manuscrita de ${signature.signerName}`}
            className="h-24 w-full max-w-sm rounded-md border border-emerald-200 bg-white object-contain p-2 portal:h-28 portal:rounded-none portal:border-0 portal:bg-marfim portal:p-3"
          />
          <figcaption className="mt-1 text-xs text-emerald-800 portal:mt-2 portal:text-areia">
            Assinatura manuscrita capturada no ato da assinatura.
          </figcaption>
        </figure>
      )}

      <div className="mt-3 portal:mt-4">
        <p>
          Assinante: <span className="portal:text-marfim">{signature.signerName}</span>
        </p>
        {/* Sem o fuso, o servidor na Vercel mostraria o horário de Greenwich. */}
        <p>Data/hora: {signature.signedAt.toLocaleString("pt-BR", { timeZone: APP_TIME_ZONE })}</p>
        {detailed && (
          <>
            <p>IP: {signature.ipAddress}</p>
            <p>Navegador: {signature.userAgent}</p>
          </>
        )}
      </div>

      {auditUrl && (
        <p className="mt-3 portal:mt-4">
          <a
            href={auditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-emerald-700 portal:text-ouro portal:no-underline portal:hover:text-ouro-claro"
          >
            Abrir relatório de auditoria (PDF)
          </a>
        </p>
      )}
    </div>
  );
}
