"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: LoginState = {};

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email ou CPF
        </label>
        {/* type="text": um CPF não passa pela validação nativa de e-mail. */}
        <input
          id="email"
          name="email"
          type="text"
          required
          autoComplete="username"
          placeholder="voce@empresa.com.br ou 000.000.000-00"
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Senha
          </label>
          <Link href="/esqueci-senha" className="text-xs text-slate-500 underline hover:text-slate-900">
            Esqueceu a senha?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
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
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
