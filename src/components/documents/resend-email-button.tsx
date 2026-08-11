"use client";

import { useActionState } from "react";
import {
  resendDocumentEmailAction,
  type ResendDocumentEmailState,
} from "@/lib/actions/documents";
import { buttonSecondary } from "@/components/ui/styles";

const initialState: ResendDocumentEmailState = {};

export function ResendEmailButton({
  documentId,
  recipientEmail,
}: {
  documentId: string;
  recipientEmail: string;
}) {
  const [state, formAction, pending] = useActionState(resendDocumentEmailAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="documentId" value={documentId} />
      <button
        type="submit"
        disabled={pending}
        className={buttonSecondary}
        title={`Reenviar para ${recipientEmail}`}
      >
        {pending ? "Reenviando..." : "Reenviar e-mail"}
      </button>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
