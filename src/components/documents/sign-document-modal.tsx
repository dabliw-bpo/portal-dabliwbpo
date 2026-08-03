"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signDocumentAction, type SignDocumentState } from "@/lib/actions/documents";
import { buttonGhost, buttonSuccess } from "@/components/ui/styles";

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
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (pending) {
      submittedOnce.current = true;
    } else if (submittedOnce.current && !state.error) {
      setOpen(false);
    }
  }, [pending, state]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonSuccess}
      >
        Assinar documento
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="sign-document-title"
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg backdrop:bg-black/40 [&::backdrop]:bg-black/40"
      >
        <h2 id="sign-document-title" className="text-base font-semibold text-slate-900">
          Confirmar assinatura
        </h2>
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
              autoFocus
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
              className={buttonGhost}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!agreed || pending}
              className={buttonSuccess}
            >
              {pending ? "Assinando..." : "Confirmar assinatura"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
