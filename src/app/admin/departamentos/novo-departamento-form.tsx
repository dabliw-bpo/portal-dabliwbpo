"use client";

import { useActionState, useEffect, useRef } from "react";
import { createDepartmentAction, type ServiceFormState } from "@/lib/actions/services";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ServiceFormState = {};

export function NovoDepartamentoForm() {
  const [state, formAction, pending] = useActionState(createDepartmentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-slate-500">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          placeholder="DP / RH"
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="color" className="text-xs font-medium text-slate-500">
          Cor (opcional)
        </label>
        <input id="color" name="color" placeholder="#0f766e" className={`${inputBase} w-32`} />
      </div>
      <button type="submit" disabled={pending} className={buttonPrimary}>
        {pending ? "Criando..." : "Criar departamento"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}
