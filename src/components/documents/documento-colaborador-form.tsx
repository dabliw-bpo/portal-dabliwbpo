"use client";

import { useActionState, useState } from "react";
import { uploadDocumentAction, type UploadDocumentState } from "@/lib/actions/documents";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: UploadDocumentState = {};

/** "2026-08" -> "08/2026" */
function monthLabel(value: string): string {
  const [year, month] = value.split("-");
  return year && month ? `${month}/${year}` : "";
}

export function DocumentoColaboradorForm({
  ownerUserId,
  ownerName,
  redirectTo,
  mode,
}: {
  ownerUserId: string;
  ownerName: string;
  redirectTo: string;
  mode: "payslip" | "other";
}) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);
  const [referenceMonth, setReferenceMonth] = useState("");

  const payslipTitle = referenceMonth ? `Holerite ${monthLabel(referenceMonth)}` : "";

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <input type="hidden" name="ownerUserId" value={ownerUserId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Destinatário</span>
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">{ownerName}</p>
      </div>

      {mode === "payslip" ? (
        <>
          <input type="hidden" name="type" value="PAYSLIP" />
          <input type="hidden" name="title" value={payslipTitle} />
          <div className="flex flex-col gap-1">
            <label htmlFor="referenceMonth" className="text-sm font-medium text-slate-700">
              Competência
            </label>
            <input
              id="referenceMonth"
              name="referenceMonth"
              type="month"
              required
              value={referenceMonth}
              onChange={(event) => setReferenceMonth(event.target.value)}
              className={inputBase}
            />
            {payslipTitle && (
              <p className="text-xs text-slate-500">O documento será salvo como “{payslipTitle}”.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Título
            </label>
            <input id="title" name="title" required className={inputBase} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="type" className="text-sm font-medium text-slate-700">
              Tipo
            </label>
            <select id="type" name="type" defaultValue="OTHER" className={inputBase}>
              <option value="CONTRACT">Contrato</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="file" className="text-sm font-medium text-slate-700">
          Arquivo (PDF, DOC(X), PNG ou JPG — até 15MB)
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

      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        O documento ficará pendente até que {ownerName.split(" ")[0]} o assine no portal com
        assinatura manuscrita.
      </p>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Enviando..." : "Enviar documento"}
      </button>
    </form>
  );
}
