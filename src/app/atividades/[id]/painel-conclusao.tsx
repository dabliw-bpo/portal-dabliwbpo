"use client";

import { useActionState } from "react";
import {
  attachTaskDocumentAction,
  completeTaskAction,
  type TaskActionState,
} from "@/lib/actions/tasks";
import { buttonSuccess, buttonSecondary, inputBase } from "@/components/ui/styles";

const initialState: TaskActionState = {};

/**
 * Entrega da atividade: anexar um documento é opcional e nunca trava a
 * conclusão — o que bloqueia concluir é só o checklist obrigatório.
 */
export function PainelConclusao({
  taskId,
  defaultTitle,
  disabled,
}: {
  taskId: string;
  defaultTitle: string;
  disabled: boolean;
}) {
  const [attachState, attachAction, attachPending] = useActionState(
    attachTaskDocumentAction,
    initialState
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeTaskAction,
    initialState
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Entrega</h2>
      <p className="mt-1 text-xs text-slate-500">
        Anexar um documento é opcional — a atividade pode ser concluída sem ele.
      </p>

      {!disabled && (
        <form action={attachAction} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="taskId" value={taskId} />
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-xs font-medium text-slate-500">
              Título do documento
            </label>
            <input
              id="title"
              name="title"
              defaultValue={defaultTitle}
              required
              maxLength={200}
              className={inputBase}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="file" className="text-xs font-medium text-slate-500">
              Arquivo (PDF, DOC(X), PNG ou JPG, até 15MB)
            </label>
            <input id="file" name="file" type="file" required className={inputBase} />
          </div>
          <button type="submit" disabled={attachPending} className={buttonSecondary}>
            {attachPending ? "Anexando..." : "Anexar documento"}
          </button>
          {attachState.error && (
            <p className="text-sm text-red-600" role="alert">
              {attachState.error}
            </p>
          )}
          {attachState.success && (
            <p className="text-sm text-emerald-700" role="status">
              {attachState.success}
            </p>
          )}
        </form>
      )}

      <form action={completeAction} className="mt-4 border-t border-slate-100 pt-4">
        <input type="hidden" name="taskId" value={taskId} />
        <button
          type="submit"
          disabled={completePending || disabled}
          className={buttonSuccess}
        >
          {completePending ? "Concluindo..." : "Concluir atividade"}
        </button>
        {completeState.error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {completeState.error}
          </p>
        )}
        {completeState.success && (
          <p className="mt-2 text-sm text-emerald-700" role="status">
            {completeState.success}
          </p>
        )}
      </form>
    </div>
  );
}
