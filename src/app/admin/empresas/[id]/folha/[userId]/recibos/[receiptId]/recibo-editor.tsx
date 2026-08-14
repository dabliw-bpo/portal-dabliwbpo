"use client";

import { useActionState, useState } from "react";
import {
  saveReceiptSignaturesAction,
  updateReceiptAction,
  type ReceiptFormState,
} from "@/lib/actions/receipts";
import { SignaturePad } from "@/components/documents/signature-pad";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ReceiptFormState = {};

type Tab = "dados" | "assinaturas";

function SavedSignature({ label, image }: { label: string; image: string | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL inline */}
          <img
            src={image}
            alt={`Assinatura de ${label.toLowerCase()}`}
            className="mt-2 h-16 w-full max-w-[220px] rounded bg-white object-contain p-1"
          />
          <p className="mt-1 text-xs text-emerald-700">Coletada.</p>
        </>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Ainda não coletada.</p>
      )}
    </div>
  );
}

export function ReciboEditor({
  receipt,
}: {
  receipt: {
    id: string;
    description: string;
    amountInput: string;
    companySignatureImage: string | null;
    collaboratorSignatureImage: string | null;
  };
}) {
  const [tab, setTab] = useState<Tab>("dados");

  const [dataState, dataAction, savingData] = useActionState(
    updateReceiptAction.bind(null, receipt.id),
    initialState
  );
  const [signState, signAction, savingSign] = useActionState(
    saveReceiptSignaturesAction.bind(null, receipt.id),
    initialState
  );

  const tabClass = (key: Tab) =>
    `border-b-2 px-3 py-2 text-sm transition-colors ${
      tab === key
        ? "border-[#6e5a35] font-medium text-slate-900"
        : "border-transparent text-slate-500 hover:text-slate-900"
    }`;

  return (
    <div className="mt-6">
      <div className="flex gap-1 border-b border-slate-200">
        <button type="button" onClick={() => setTab("dados")} className={tabClass("dados")}>
          Dados do pagamento
        </button>
        <button
          type="button"
          onClick={() => setTab("assinaturas")}
          className={tabClass("assinaturas")}
        >
          Assinaturas
        </button>
      </div>

      {tab === "dados" ? (
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

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={savingData} className={buttonPrimary}>
              {savingData ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      ) : (
        <form action={signAction} className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SavedSignature label="Empresa" image={receipt.companySignatureImage} />
            <SavedSignature label="Colaborador" image={receipt.collaboratorSignatureImage} />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Desenhe abaixo para coletar ou substituir. O que ficar em branco mantém a assinatura já
            salva.
          </p>

          <div className="mt-3 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Pela empresa
              </p>
              <SignaturePad name="companySignatureImage" />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Pelo colaborador
              </p>
              <SignaturePad name="collaboratorSignatureImage" />
            </div>
          </div>

          {signState.error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {signState.error}
            </p>
          )}
          {signState.success && (
            <p className="mt-3 text-sm text-emerald-700" role="status">
              {signState.success}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={savingSign} className={buttonPrimary}>
              {savingSign ? "Salvando..." : "Salvar assinaturas"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
