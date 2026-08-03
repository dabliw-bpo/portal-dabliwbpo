"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type UploadDocumentState } from "@/lib/actions/documents";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: UploadDocumentState = {};

type OwnerOption = { id: string; name: string; email: string };

export function NovoDocumentoForm({
  owners,
  redirectTo,
}: {
  owners: OwnerOption[];
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="ownerUserId" className="text-sm font-medium text-slate-700">
          Destinatário
        </label>
        <select
          id="ownerUserId"
          name="ownerUserId"
          required
          className={inputBase}
        >
          <option value="">Selecione...</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} ({owner.email})
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="type" className="text-sm font-medium text-slate-700">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          defaultValue="CONTRACT"
          className={inputBase}
        >
          <option value="CONTRACT">Contrato</option>
          <option value="VACATION_REQUEST">Férias</option>
          <option value="OTHER">Outro</option>
        </select>
      </div>
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
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className={`mt-2 ${buttonPrimary}`}
      >
        {pending ? "Enviando..." : "Enviar documento"}
      </button>
    </form>
  );
}
