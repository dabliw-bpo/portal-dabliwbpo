"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type UploadDocumentState } from "@/lib/actions/documents";

const initialState: UploadDocumentState = {};

type OwnerOption = { id: string; name: string; email: string };

export function NovoDocumentoForm({ owners }: { owners: OwnerOption[] }) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="title"
          name="title"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Enviando..." : "Enviar documento"}
      </button>
    </form>
  );
}
