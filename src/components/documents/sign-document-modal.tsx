"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { signDocumentAction, type SignDocumentState } from "@/lib/actions/documents";
import { SignaturePad } from "@/components/documents/signature-pad";
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
  const [hasSignature, setHasSignature] = useState(false);
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
      <button type="button" onClick={() => setOpen(true)} className={`shrink-0 ${buttonSuccess}`}>
        Assinar documento
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="sign-document-title"
        className="m-auto w-[calc(100%-2rem)] max-w-lg border border-fio-forte bg-cartao p-6 text-marfim shadow-[0_40px_90px_-20px_rgba(0,0,0,0.95)] backdrop:bg-breu/80 backdrop:backdrop-blur-sm sm:p-8"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ouro">
          Assinatura eletrônica
        </p>
        <h2
          id="sign-document-title"
          className="mt-3 font-serifa text-3xl font-medium leading-tight text-marfim"
        >
          Confirmar assinatura
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-areia">
          Você está assinando como <strong className="font-medium text-marfim">{signerName}</strong>.
          Ficam registrados a sua assinatura manuscrita, o seu nome, a data, a hora e o endereço de
          onde você assinou.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-5">
          <input type="hidden" name="documentId" value={documentId} />

          <SignaturePad name="signatureImage" onSignatureChange={setHasSignature} />

          <label className="flex items-start gap-3 text-sm text-areia">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-ouro"
            />
            Li e concordo com o conteúdo deste documento.
          </label>

          {state.error && (
            <p className="text-sm text-terracota" role="alert">
              {state.error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className={buttonGhost}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!agreed || !hasSignature || pending}
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
