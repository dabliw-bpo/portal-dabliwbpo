"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signDocumentAction, type SignDocumentState } from "@/lib/actions/documents";

const initialState: SignDocumentState = {};

export function SignDocumentModal({
  documentId,
  signerName,
}: {
  documentId: string;
  signerName: string;
}) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [state, formAction, pending] = useActionState(signDocumentAction, initialState);
  const submittedOnce = useRef(false);

  useEffect(() => {
    if (pending) {
      submittedOnce.current = true;
    } else if (submittedOnce.current && !state.error) {
      setOpen(false);
    }
  }, [pending, state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        Assinar documento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-base font-semibold text-slate-900">Confirmar assinatura</h2>
            <p className="mt-2 text-sm text-slate-600">
              Você está assinando este documento como <strong>{signerName}</strong>. Será
              registrado seu nome, data/hora e endereço IP como comprovação.
            </p>

            <form action={formAction} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="documentId" value={documentId} />
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5"
                />
                Li e concordo com o conteúdo deste documento.
              </label>

              {state.error && (
                <p className="text-sm text-red-600" role="alert">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!agreed || pending}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending ? "Assinando..." : "Confirmar assinatura"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
