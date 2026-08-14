"use client";

import { useActionState, useState } from "react";
import { deleteCompanyAction, type DeleteCompanyState } from "@/lib/actions/companies";
import { buttonDanger, buttonSecondary, inputBase } from "@/components/ui/styles";

const initialState: DeleteCompanyState = {};

/**
 * Exclusão de empresa. Leva pessoas, documentos, holerites, recibos e contas
 * junto, então exige digitar a razão social: um clique distraído não deve
 * conseguir apagar o histórico inteiro de um cliente.
 */
export function DeleteCompanyForm({
  companyId,
  companyName,
  counts,
}: {
  companyId: string;
  companyName: string;
  counts: { people: number; documents: number; receipts: number; bankAccounts: number };
}) {
  const [state, formAction, pending] = useActionState(deleteCompanyAction, initialState);
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const willDelete = [
    counts.people > 0 && `${counts.people} pessoa(s)`,
    counts.documents > 0 && `${counts.documents} documento(s)`,
    counts.receipts > 0 && `${counts.receipts} recibo(s)`,
    counts.bankAccounts > 0 && `${counts.bankAccounts} conta(s) bancária(s)`,
  ].filter(Boolean) as string[];

  if (!open) {
    return (
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => setOpen(true)} className={buttonDanger}>
          Excluir empresa
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
      <input type="hidden" name="companyId" value={companyId} />
      <h2 className="text-sm font-semibold text-red-900">Excluir {companyName}</h2>
      <p className="mt-2 text-sm text-red-800">
        {willDelete.length > 0
          ? `Serão apagados junto: ${willDelete.join(", ")}. Não há como desfazer.`
          : "Esta empresa não tem nada vinculado. Não há como desfazer."}
      </p>

      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="confirmName" className="text-sm font-medium text-red-900">
          Digite a razão social para confirmar
        </label>
        <input
          id="confirmName"
          name="confirmName"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder={companyName}
          autoComplete="off"
          className={`${inputBase} max-w-md`}
        />
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className={buttonSecondary}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending || typed.trim() !== companyName}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        >
          {pending ? "Excluindo..." : "Excluir definitivamente"}
        </button>
      </div>
    </form>
  );
}
