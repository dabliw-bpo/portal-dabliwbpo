"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  sendReceiptForSignatureAction,
  updateReceiptAction,
  type ReceiptFormState,
} from "@/lib/actions/receipts";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ReceiptFormState = {};

/**
 * Rascunho até o envio: valor e descrição são livres. No envio o recibo vira o
 * PDF que o colaborador assina, e por isso congela — quem assina é ele, como
 * manda um recibo, e não a empresa que paga.
 */
export function ReciboEditor({
  receipt,
}: {
  receipt: {
    id: string;
    description: string;
    amountInput: string;
    /** Preenchido depois do envio. */
    documentUrl: string | null;
    collaboratorEmail: string;
    signedAt: Date | null;
  };
}) {
  const [sendState, sendAction, sending] = useActionState(
    sendReceiptForSignatureAction,
    initialState
  );
  const [dataState, dataAction, savingData] = useActionState(
    updateReceiptAction.bind(null, receipt.id),
    initialState
  );

  const sent = receipt.documentUrl !== null;

  return (
    <div className="mt-6">
      {sent ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-900">
            Enviado para {receipt.collaboratorEmail}
          </p>
          <p className="mt-1 text-sm text-emerald-800">
            {receipt.signedAt
              ? `Assinado em ${receipt.signedAt.toLocaleString("pt-BR")}.`
              : "Aguardando a assinatura do colaborador no portal dele."}{" "}
            Valor e descrição estão travados: é este arquivo que foi enviado para assinar.
          </p>
          <Link
            href={receipt.documentUrl!}
            className="mt-2 inline-block text-sm font-medium text-emerald-900 underline"
          >
            Abrir o documento e a trilha de auditoria
          </Link>
        </div>
      ) : (
        <form action={sendAction} className="rounded-lg border border-slate-200 bg-white p-4">
          <input type="hidden" name="receiptId" value={receipt.id} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Rascunho</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Confira o valor e a descrição abaixo. Ao enviar, o recibo vira PDF e segue por
                e-mail para o colaborador assinar no portal dele.
              </p>
            </div>
            <button type="submit" disabled={sending} className={buttonPrimary}>
              {sending ? "Enviando..." : "Enviar para assinatura"}
            </button>
          </div>
          {sendState.error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {sendState.error}
            </p>
          )}
          {sendState.success && (
            <p className="mt-3 text-sm text-emerald-700" role="status">
              {sendState.success}
            </p>
          )}
        </form>
      )}

      <form action={dataAction} className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="flex flex-col gap-1 sm:col-span-4">
            <label htmlFor="description" className="text-sm font-medium text-slate-700">
              Descrição do pagamento
            </label>
            <input
              id="description"
              name="description"
              required
              disabled={sent}
              defaultValue={receipt.description}
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
              disabled={sent}
              defaultValue={receipt.amountInput}
              className={inputBase}
            />
          </div>
        </div>

        {dataState.error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {dataState.error}
          </p>
        )}
        {dataState.success && (
          <p className="mt-3 text-sm text-emerald-700" role="status">
            {dataState.success}
          </p>
        )}

        {!sent && (
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={savingData} className={buttonPrimary}>
              {savingData ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
