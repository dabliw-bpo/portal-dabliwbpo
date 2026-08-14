"use client";

import { useActionState } from "react";
import { createReceiptAction, type ReceiptFormState } from "@/lib/actions/receipts";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ReceiptFormState = {};

export function NovoReciboForm({
  companyId,
  userId,
}: {
  companyId: string;
  userId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createReceiptAction.bind(null, companyId, userId),
    initialState
  );

  return (
    <form action={formAction} className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Novo recibo</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-6">
        <div className="flex flex-col gap-1 sm:col-span-4">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descrição do pagamento
          </label>
          <input
            id="description"
            name="description"
            required
            placeholder="Vale adiantamento de salário"
            className={inputBase}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="amount" className="text-sm font-medium text-slate-700">
            Valor (R$)
          </label>
          <input
            id="amount"
            name="amount"
            required
            inputMode="decimal"
            placeholder="1.500,00"
            className={inputBase}
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Emitindo..." : "Emitir recibo"}
        </button>
      </div>
    </form>
  );
}
