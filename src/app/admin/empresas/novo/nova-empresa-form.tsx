"use client";

import { useActionState } from "react";
import { createCompanyAction, type CompanyFormState } from "@/lib/actions/companies";
import {
  CompanyRegistrationFields,
  emptyRegistrationValues,
} from "@/components/companies/company-registration-fields";
import { buttonPrimary } from "@/components/ui/styles";

const initialState: CompanyFormState = {};

export function NovaEmpresaForm() {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <CompanyRegistrationFields values={emptyRegistrationValues} />
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Salvando..." : "Criar empresa"}
        </button>
      </div>
    </form>
  );
}
