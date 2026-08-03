"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type RequestPasswordResetState } from "@/lib/actions/auth";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: RequestPasswordResetState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, initialState);

  if (state.message) {
    return (
      <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
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
          className={inputBase}
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
