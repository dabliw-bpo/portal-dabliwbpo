"use client";

import { useActionState } from "react";
import { updateCompanyLogoAction, type CompanyLogoState } from "@/lib/actions/companies";
import { buttonSecondary } from "@/components/ui/styles";

const initialState: CompanyLogoState = {};

export function CompanyLogoForm({
  companyId,
  companyName,
  logoUrl,
}: {
  companyId: string;
  companyName: string;
  logoUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateCompanyLogoAction.bind(null, companyId),
    initialState
  );

  return (
    <div className="mt-6 flex flex-wrap items-center gap-5 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase public bucket, no loader configured
          <img
            src={logoUrl}
            alt={`Logo de ${companyName}`}
            className="max-h-[72px] max-w-[72px] object-contain"
          />
        ) : (
          <span className="px-1 text-center text-[10px] leading-tight text-slate-400">
            Sem logo
          </span>
        )}
      </div>

      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="logo" className="text-sm font-medium text-slate-700">
          Logo da empresa
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="logo"
            name="logo"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <button type="submit" disabled={pending} className={buttonSecondary}>
            {pending ? "Enviando..." : "Salvar logo"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          PNG, JPG ou WEBP até 5MB. Aparece no topo do portal para quem é desta empresa.
        </p>
        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-emerald-700" role="status">
            Logo atualizada.
          </p>
        )}
      </form>
    </div>
  );
}
