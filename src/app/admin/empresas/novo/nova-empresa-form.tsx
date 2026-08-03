"use client";

import { useActionState } from "react";
import { createCompanyAction, type CreateCompanyState } from "@/lib/actions/companies";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: CreateCompanyState = {};

export function NovaEmpresaForm() {
  const [state, formAction, pending] = useActionState(createCompanyAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome da empresa
        </label>
        <input id="name" name="name" required className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="text-sm font-medium text-slate-700">
          CNPJ (opcional)
        </label>
        <input id="cnpj" name="cnpj" className={inputBase} />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Salvando..." : "Criar empresa"}
      </button>
    </form>
  );
}
