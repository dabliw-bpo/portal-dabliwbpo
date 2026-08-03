"use client";

import { useActionState } from "react";
import { createVacationRequestAction, type VacationFormState } from "@/lib/actions/vacation";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: VacationFormState = {};

export function NovaSolicitacaoForm() {
  const [state, formAction, pending] = useActionState(createVacationRequestAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="startDate" className="text-sm font-medium text-slate-700">
          Data de início
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="endDate" className="text-sm font-medium text-slate-700">
          Data de fim
        </label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          required
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className="text-sm font-medium text-slate-700">
          Observações (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
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
        {pending ? "Enviando..." : "Solicitar férias"}
      </button>
    </form>
  );
}
