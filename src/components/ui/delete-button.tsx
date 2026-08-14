"use client";

import { useActionState, useState } from "react";
import { buttonDanger, buttonSecondary } from "@/components/ui/styles";

type DeleteState = { error?: string };

/**
 * Exclusão em dois passos. O primeiro clique só revela a pergunta; nada sai
 * do lugar antes da confirmação, e o texto diz o que será apagado em vez de
 * perguntar "tem certeza?".
 */
export function DeleteButton({
  action,
  hidden,
  label = "Excluir",
  question,
}: {
  action: (state: DeleteState, formData: FormData) => Promise<DeleteState>;
  /** Campos que a action precisa, como o id do registro. */
  hidden: Record<string, string>;
  label?: string;
  question: string;
}) {
  const [state, formAction, pending] = useActionState(action, {} as DeleteState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button type="button" onClick={() => setConfirming(true)} className={buttonDanger}>
          {label}
        </button>
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-3">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <span className="text-sm text-slate-700">{question}</span>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={pending}
        className={buttonSecondary}
      >
        Cancelar
      </button>
      <button type="submit" disabled={pending} className={buttonDanger}>
        {pending ? "Excluindo..." : `Sim, ${label.toLowerCase()}`}
      </button>
    </form>
  );
}
