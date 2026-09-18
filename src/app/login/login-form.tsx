"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: LoginState = {};

const rotulo = "text-[11px] font-medium uppercase tracking-[0.22em] text-areia";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={rotulo}>
          E-mail ou CPF
        </label>
        {/* type="text": um CPF não passa pela validação nativa de e-mail. */}
        <input
          id="email"
          name="email"
          type="text"
          required
          autoComplete="username"
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className={rotulo}>
            Senha
          </label>
          <Link
            href="/esqueci-senha"
            className="text-xs text-ouro transition-colors hover:text-ouro-claro"
          >
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
        <p className="text-sm text-terracota" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 w-full ${buttonPrimary}`}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
