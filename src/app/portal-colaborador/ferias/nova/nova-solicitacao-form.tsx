"use client";

import { useActionState } from "react";
import { createVacationRequestAction, type VacationFormState } from "@/lib/actions/vacation";
import { VACATION_OPTIONS, VACATION_OPTION_LABELS } from "@/lib/validations/vacation";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: VacationFormState = {};

const rotulo = "text-[11px] font-medium uppercase tracking-[0.22em] text-areia";

export function NovaSolicitacaoForm() {
  const [state, formAction, pending] = useActionState(createVacationRequestAction, initialState);

  return (
    <form action={formAction} className="mt-10 flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="option" className={rotulo}>
          Dias de férias
        </label>
        <select id="option" name="option" required defaultValue="" className={inputBase}>
          <option value="" disabled>
            Selecione...
          </option>
          {VACATION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {VACATION_OPTION_LABELS[option]}
            </option>
          ))}
        </select>
        <p className="text-xs text-areia">Quantos dias você pretende tirar, ou a venda de 10 dias.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="startDate" className={rotulo}>
          Primeiro dia
        </label>
        <input id="startDate" name="startDate" type="date" required className={inputBase} />
        <p className="text-xs text-areia">
          Informe apenas o primeiro dia. A contabilidade apura o restante.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="notes" className={rotulo}>
          Observações (opcional)
        </label>
        <textarea id="notes" name="notes" rows={3} className={inputBase} />
      </div>

      {state.error && (
        <p className="text-sm text-terracota" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Enviando..." : "Solicitar férias"}
      </button>
    </form>
  );
}
