"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "@/lib/actions/users";
import { buttonPrimary, inputBase } from "@/components/ui/styles";
import { MIN_PASSWORD_LENGTH } from "@/lib/validations/password";

const initialState: CreateUserState = {};

export function NovoColaboradorForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <input type="hidden" name="role" value="COLLABORATOR" />
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome
        </label>
        <input id="name" name="name" required className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">
          WhatsApp (opcional)
        </label>
        <input id="whatsapp" name="whatsapp" placeholder="(65) 99999-9999" className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="cpf" className="text-sm font-medium text-slate-700">
          CPF (opcional)
        </label>
        <input id="cpf" name="cpf" placeholder="000.000.000-00" className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="birthDate" className="text-sm font-medium text-slate-700">
          Nascimento (opcional)
        </label>
        <input id="birthDate" name="birthDate" type="date" className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="admissionDate" className="text-sm font-medium text-slate-700">
          Admissão (opcional)
        </label>
        <input id="admissionDate" name="admissionDate" type="date" className={inputBase} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Senha inicial
        </label>
        <input id="password" name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} className={inputBase} />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Salvando..." : "Criar colaborador"}
      </button>
    </form>
  );
}
