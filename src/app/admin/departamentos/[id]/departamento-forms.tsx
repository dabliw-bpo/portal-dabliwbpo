"use client";

import { useActionState } from "react";
import {
  setDepartmentMembersAction,
  updateDepartmentAction,
  type ServiceFormState,
} from "@/lib/actions/services";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ServiceFormState = {};

export function DepartamentoForm({
  departmentId,
  defaults,
}: {
  departmentId: string;
  defaults: { name: string; color: string | null; active: boolean };
}) {
  const [state, formAction, pending] = useActionState(
    updateDepartmentAction.bind(null, departmentId),
    initialState
  );

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-xs font-medium text-slate-500">
          Nome
        </label>
        <input
          id="name"
          name="name"
          defaultValue={defaults.name}
          required
          maxLength={80}
          className={inputBase}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="color" className="text-xs font-medium text-slate-500">
          Cor
        </label>
        <input
          id="color"
          name="color"
          defaultValue={defaults.color ?? ""}
          placeholder="#0f766e"
          className={`${inputBase} w-32`}
        />
      </div>
      <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
        <input type="checkbox" name="active" defaultChecked={defaults.active} />
        Ativo
      </label>
      <button type="submit" disabled={pending} className={buttonPrimary}>
        {pending ? "Salvando..." : "Salvar"}
      </button>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}
    </form>
  );
}

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  membership: "none" | "member" | "manager";
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor de departamento",
  OPERADOR: "Operador",
};

export function EquipeForm({
  departmentId,
  users,
}: {
  departmentId: string;
  users: MemberRow[];
}) {
  const [state, formAction, pending] = useActionState(
    setDepartmentMembersAction.bind(null, departmentId),
    initialState
  );

  return (
    <form action={formAction} className="mt-6 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Equipe</h2>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Salvando..." : "Salvar equipe"}
        </button>
      </div>

      {users.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-600">
          Nenhum usuário interno ativo. Crie usuários com papel Operador ou Gestor em Usuários.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Pessoa</th>
              <th scope="col" className="px-4 py-2 font-medium">Papel</th>
              <th scope="col" className="px-4 py-2 font-medium">Vínculo com o departamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 text-slate-900">
                  {user.name}
                  <span className="ml-2 text-xs text-slate-400">{user.email}</span>
                </td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[user.role] ?? user.role}</td>
                <td className="px-4 py-2">
                  <select
                    name={`membership-${user.id}`}
                    defaultValue={user.membership}
                    className={inputBase}
                    aria-label={`Vínculo de ${user.name}`}
                  >
                    <option value="none">Fora do departamento</option>
                    <option value="member">Participa</option>
                    <option value="manager">Gerencia</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(state.error || state.success) && (
        <div className="border-t border-slate-100 px-4 py-3">
          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-sm text-emerald-700" role="status">
              {state.success}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
