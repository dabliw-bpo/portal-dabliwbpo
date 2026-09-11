"use client";

import { useActionState, useState } from "react";
import { rejectSignatureAction, type RejectSignatureState } from "@/lib/actions/documents";
import { SIGNATURE_REJECTION_REASONS } from "@/lib/validations/signature";
import { buttonDanger, buttonSecondary, inputBase } from "@/components/ui/styles";

const initialState: RejectSignatureState = {};

/**
 * Recusa em dois passos, como a exclusão: o primeiro clique só abre o motivo.
 * O motivo é obrigatório porque vai no e-mail ao colaborador e fica no
 * histórico — uma recusa sem porquê não serve de prova de nada.
 */
export function RejectSignatureButton({
  documentId,
  signerName,
}: {
  documentId: string;
  signerName: string;
}) {
  const [state, formAction, pending] = useActionState(rejectSignatureAction, initialState);
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonSecondary}>
        Recusar assinatura
      </button>
    );
  }

  return (
    <form action={formAction} className="w-full rounded-lg border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="documentId" value={documentId} />

      <p className="text-sm font-medium text-red-900">Recusar a assinatura de {signerName}?</p>
      <p className="mt-1 text-sm text-red-800">
        O documento volta a aguardar assinatura e a pessoa recebe um e-mail pedindo para assinar
        de novo. A assinatura recusada fica guardada no histórico deste documento.
      </p>

      <fieldset className="mt-4 flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-slate-800">Motivo</legend>
        {Object.entries(SIGNATURE_REJECTION_REASONS).map(([value, label]) => (
          <label key={value} className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="motivo"
              value={value}
              checked={motivo === value}
              onChange={() => setMotivo(value)}
              required
            />
            {label}
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="motivo"
            value="outro"
            checked={motivo === "outro"}
            onChange={() => setMotivo("outro")}
          />
          Outro motivo
        </label>
        {motivo === "outro" && (
          <textarea
            name="detalhe"
            rows={2}
            maxLength={500}
            required
            placeholder="Explique o que precisa ser corrigido — o texto vai no e-mail."
            className={`${inputBase} mt-1`}
          />
        )}
      </fieldset>

      {state.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMotivo("");
          }}
          disabled={pending}
          className={buttonSecondary}
        >
          Cancelar
        </button>
        <button type="submit" disabled={pending || !motivo} className={buttonDanger}>
          {pending ? "Recusando..." : "Recusar e pedir nova assinatura"}
        </button>
      </div>
    </form>
  );
}
