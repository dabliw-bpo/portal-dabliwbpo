"use client";

import { useActionState } from "react";
import type { Company, Role } from "@prisma/client";
import { updateUserAction, type UpdateUserState } from "@/lib/actions/users";
import { buttonPrimary, inputBase } from "@/components/ui/styles";
import { MIN_PASSWORD_LENGTH } from "@/lib/validations/password";

const initialState: UpdateUserState = {};

export function EditarUsuarioForm({
  userId,
  companies,
  redirectTo,
  defaultValues,
}: {
  userId: string;
  companies: Company[];
  redirectTo?: string;
  defaultValues: {
    name: string;
    email: string;
    role: Role;
    active: boolean;
    companyId: string | null;
    whatsapp: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateUserAction.bind(null, userId), initialState);

  return (
    <form action={formAction} className="mt-6 flex max-w-md flex-col gap-4">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-slate-700">
          Nome
        </label>
        <input id="name" name="name" required defaultValue={defaultValues.name} className={inputBase} />
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
          defaultValue={defaultValues.email}
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">
          WhatsApp (opcional)
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          placeholder="(65) 99999-9999"
          defaultValue={defaultValues.whatsapp ?? ""}
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Nova senha (opcional)
        </label>
        <input id="password" name="password" type="password" minLength={MIN_PASSWORD_LENGTH} className={inputBase} />
        <p className="text-xs text-slate-500">Deixe em branco para manter a senha atual.</p>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-medium text-slate-700">
          Papel
        </label>
        <select id="role" name="role" defaultValue={defaultValues.role} className={inputBase}>
          <option value="CLIENT">Cliente</option>
          <option value="COLLABORATOR">Colaborador</option>
          <option value="COMPANY_HR">RH da empresa</option>
          <option value="OPERADOR">Operador</option>
          <option value="GESTOR">Gestor de departamento</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="companyId" className="text-sm font-medium text-slate-700">
          Empresa (opcional)
        </label>
        <select id="companyId" name="companyId" defaultValue={defaultValues.companyId ?? ""} className={inputBase}>
          <option value="">Nenhuma</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked={defaultValues.active} />
        Acesso ativo
      </label>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`mt-2 ${buttonPrimary}`}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
