"use client";

import { useActionState, useState } from "react";
import { reviewVacationRequestAction, type VacationFormState } from "@/lib/actions/vacation";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: VacationFormState = {};

export function ReviewForm({ requestId, redirectTo }: { requestId: string; redirectTo?: string }) {
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [state, formAction, pending] = useActionState(reviewVacationRequestAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <input type="hidden" name="requestId" value={requestId} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="decision"
            value="APPROVE"
            checked={decision === "APPROVE"}
            onChange={() => setDecision("APPROVE")}
          />
          Aprovar
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name="decision"
            value="REJECT"
            checked={decision === "REJECT"}
            onChange={() => setDecision("REJECT")}
          />
          Rejeitar
        </label>
      </div>

      {decision === "APPROVE" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="file" className="text-sm font-medium text-slate-700">
            Documento do acordo de férias (PDF, DOC(X), PNG ou JPG)
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            className={inputBase}
          />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="reviewNotes" className="text-sm font-medium text-slate-700">
          Observações (opcional)
        </label>
        <textarea
          id="reviewNotes"
          name="reviewNotes"
          rows={3}
          className={inputBase}
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`mt-2 ${buttonPrimary}`}
      >
        {pending ? "Salvando..." : decision === "APPROVE" ? "Aprovar e enviar documento" : "Rejeitar solicitação"}
      </button>
    </form>
  );
}
