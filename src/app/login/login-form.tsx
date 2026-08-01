"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-slate-500"
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
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
