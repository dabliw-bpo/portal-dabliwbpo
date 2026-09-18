"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: RequestPasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.message) {
    return (
      <p className="mt-8 border border-salvia/30 bg-salvia/10 p-4 text-sm text-marfim" role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-areia"
        >
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputBase}
        />
      </div>
      {state.error && (
        <p className="text-sm text-terracota" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 w-full ${buttonPrimary}`}>
        {pending ? "Enviando..." : "Enviar link"}
      </button>
    </form>
  );
}
