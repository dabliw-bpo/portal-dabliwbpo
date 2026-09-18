"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";
import { MIN_PASSWORD_LENGTH } from "@/lib/validations/password";

const initialState: ResetPasswordState = {};

const rotulo = "text-[11px] font-medium uppercase tracking-[0.22em] text-areia";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={rotulo}>
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          aria-describedby="password-hint"
          className={inputBase}
        />
        <p id="password-hint" className="text-xs text-areia">
          Pelo menos {MIN_PASSWORD_LENGTH} caracteres.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="confirmPassword" className={rotulo}>
          Repita a senha nova
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={inputBase}
        />
      </div>
      {state.error && (
        <p className="text-sm text-terracota" role="alert">
          {state.error}{" "}
          <Link href="/esqueci-senha" className="text-ouro underline hover:text-ouro-claro">
            Pedir um link novo
          </Link>
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 w-full ${buttonPrimary}`}>
        {pending ? "Salvando..." : "Salvar senha nova"}
      </button>
    </form>
  );
}
