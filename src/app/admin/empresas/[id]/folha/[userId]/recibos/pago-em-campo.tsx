"use client";

import { useActionState, useState } from "react";
import { setReceiptPaidAtAction, type ReceiptFormState } from "@/lib/actions/receipts";
import { inputBase } from "@/components/ui/styles";

const initialState: ReceiptFormState = {};

/**
 * A data em que o valor foi pago, editável na própria linha. Só aparece o
 * botão quando a data muda, para a coluna continuar leve com dezenas de
 * recibos; vazio limpa o campo.
 */
export function PagoEmCampo({
  receiptId,
  inicial,
}: {
  receiptId: string;
  /** AAAA-MM-DD, ou vazio quando ainda não foi informada. */
  inicial: string;
}) {
  const [valor, setValor] = useState(inicial);
  const [state, action, pending] = useActionState(
    setReceiptPaidAtAction.bind(null, receiptId),
    initialState
  );
  const alterado = valor !== inicial;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`pago-${receiptId}`}>
        Data do pagamento
      </label>
      <input
        id={`pago-${receiptId}`}
        name="paidAt"
        type="date"
        value={valor}
        onChange={(event) => setValor(event.target.value)}
        className={`${inputBase} w-40 py-1`}
      />
      {alterado && (
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
        </button>
      )}
      {!alterado && state.success && (
        <span className="text-xs text-emerald-700" role="status">
          {state.success}
        </span>
      )}
      {state.error && (
        <span className="text-xs text-red-600" role="alert">
          {state.error}
        </span>
      )}
    </form>
  );
}
