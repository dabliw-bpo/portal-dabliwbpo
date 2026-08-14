"use client";

import { useActionState } from "react";
import {
  resendAllPendingEmailsAction,
  type ResendAllState,
} from "@/lib/actions/documents";
import { buttonSecondary } from "@/components/ui/styles";

const initialState: ResendAllState = {};

/** Reenvia a cobrança de assinatura de todos os documentos parados. */
export function ResendAllButton() {
  const [state, formAction, pending] = useActionState(
    resendAllPendingEmailsAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button type="submit" disabled={pending} className={buttonSecondary}>
        {pending ? "Reenviando..." : "Reenviar e-mails"}
      </button>
      {(state.error || state.success) && (
        <p
          role="status"
          className={`text-xs ${state.error ? "text-red-600" : "text-slate-600"}`}
        >
          {state.error ?? state.success}
        </p>
      )}
    </form>
  );
}
