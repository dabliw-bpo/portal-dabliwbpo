"use client";

import { useActionState, useRef, useState } from "react";
import {
  updateCompanyRegistrationAction,
  type CompanyFormState,
} from "@/lib/actions/companies";
import {
  CompanyRegistrationFields,
  type CompanyRegistrationValues,
} from "@/components/companies/company-registration-fields";
import { buttonPrimary, buttonSecondary } from "@/components/ui/styles";

const initialState: CompanyFormState = {};

export function CadastroForm({
  companyId,
  values,
}: {
  companyId: string;
  values: CompanyRegistrationValues;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyRegistrationAction.bind(null, companyId),
    initialState
  );
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [handledState, setHandledState] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Adjust state during render (rather than in an effect) once the action
  // reports a save, so the panel drops back to read-only.
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setEditing(false);
      setDirty(false);
    }
  }

  function cancel() {
    formRef.current?.reset();
    setEditing(false);
    setDirty(false);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => setDirty(true)}
      className="mt-6 flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {editing
            ? dirty
              ? "Há alterações não salvas."
              : "Altere os campos necessários e salve."
            : "Dados do Cartão CNPJ."}
        </p>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button type="button" onClick={cancel} disabled={pending} className={buttonSecondary}>
                Cancelar
              </button>
              <button type="submit" disabled={pending || !dirty} className={buttonPrimary}>
                {pending ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={buttonSecondary}>
              Editar
            </button>
          )}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && !editing && (
        <p className="text-sm text-emerald-700" role="status">
          Cadastro salvo.
        </p>
      )}

      <CompanyRegistrationFields values={values} disabled={!editing} />
    </form>
  );
}
