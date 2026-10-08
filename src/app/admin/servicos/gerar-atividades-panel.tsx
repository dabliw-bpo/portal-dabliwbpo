"use client";

import { useActionState } from "react";
import type { GenerationRun } from "@prisma/client";
import { runGenerationAction, type ServiceFormState } from "@/lib/actions/services";
import { buttonSecondary, inputBase } from "@/components/ui/styles";
import { formatDeadline } from "@/lib/format";

const initialState: ServiceFormState = {};

/**
 * Gatilho manual do gerador. Enquanto não há agendamento, é o que permite
 * contratar um serviço e ver a atividade na fila sem passar pelo terminal.
 * Rodar duas vezes é inofensivo — a geração é idempotente.
 */
export function GerarAtividadesPanel({ lastRun }: { lastRun: GenerationRun | null }) {
  const [state, formAction, pending] = useActionState(runGenerationAction, initialState);

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="horizonDays" className="text-xs font-medium text-slate-500">
          Horizonte (dias)
        </label>
        <input
          id="horizonDays"
          name="horizonDays"
          type="number"
          min={1}
          max={365}
          defaultValue={30}
          className={`${inputBase} w-28`}
        />
      </div>

      <button type="submit" disabled={pending} className={buttonSecondary}>
        {pending ? "Gerando..." : "Gerar atividades"}
      </button>

      <div className="flex flex-col gap-0.5 text-xs">
        {lastRun && (
          <span className="text-slate-500">
            Última execução: {formatDeadline(lastRun.startedAt)} · {lastRun.tasksCreated} criada(s),{" "}
            {lastRun.tasksSkipped} já existiam
          </span>
        )}
        {state.error && (
          <span className="text-sm text-red-600" role="alert">
            {state.error}
          </span>
        )}
        {state.success && (
          <span className="text-sm text-emerald-700" role="status">
            {state.success}
          </span>
        )}
      </div>
    </form>
  );
}
