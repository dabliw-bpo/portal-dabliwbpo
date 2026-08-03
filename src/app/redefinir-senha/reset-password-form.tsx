"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
          Confirmar nova senha
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={inputBase}
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}{" "}
          <Link href="/esqueci-senha" className="underline">
            Solicitar novo link
          </Link>
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
