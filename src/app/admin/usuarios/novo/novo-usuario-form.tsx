"use client";

import { useActionState } from "react";
import { createUserAction, type CreateUserState } from "@/lib/actions/users";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: CreateUserState = {};

export function NovoUsuarioForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome
        </label>
        <input
          id="name"
          name="name"
          required
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Senha inicial
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-slate-700">
          Papel
        </label>
        <select
          id="role"
          name="role"
          defaultValue="CLIENT"
          className={inputBase}
        >
          <option value="CLIENT">Cliente</option>
          <option value="COLLABORATOR">Colaborador</option>
          <option value="ADMIN">Admin</option>
        </select>
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
        {pending ? "Salvando..." : "Criar usuário"}
      </button>
    </form>
  );
}
