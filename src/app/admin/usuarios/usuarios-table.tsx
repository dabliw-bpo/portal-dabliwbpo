"use client";

import { useActionState, useState } from "react";
import type { User } from "@prisma/client";
import { deleteUsersAction, type DeleteUsersState } from "@/lib/actions/users";
import { buttonGhost } from "@/components/ui/styles";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COLLABORATOR: "Colaborador",
  CLIENT: "Cliente",
};

const initialState: DeleteUsersState = {};

export function UsuariosTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [state, formAction, pending] = useActionState(deleteUsersAction, initialState);

  const [lastHandledSuccess, setLastHandledSuccess] = useState(state.success);
  if (state.success !== lastHandledSuccess) {
    setLastHandledSuccess(state.success);
    if (state.success) {
      setSelected(new Set());
      setConfirmingDelete(false);
    }
  }

  const selectableIds = users.filter((user) => user.id !== currentUserId).map((user) => user.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setConfirmingDelete(false);
  }

  return (
    <div className="mt-6">
      {selected.size > 0 && !confirmingDelete && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-sm text-slate-600">{selected.size} selecionado(s)</span>
          {selected.size === 1 && (
            <a href={`/admin/usuarios/${[...selected][0]}/editar`} className={buttonGhost}>
              Alterar
            </a>
          )}
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-md px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Excluir
          </button>
        </div>
      )}

      {confirmingDelete && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <span className="text-sm text-red-800">
            Excluir {selected.size} usuário(s)? Esta ação não pode ser desfeita.
          </span>
          <form action={formAction} className="flex items-center gap-3">
            {[...selected].map((id) => (
              <input key={id} type="hidden" name="userId" value={id} />
            ))}
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              {pending ? "Excluindo..." : "Sim, excluir"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </button>
        </div>
      )}

      {state.error && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mb-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="w-10 px-4 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  aria-label="Selecionar todos os usuários"
                />
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Nome
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Papel
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className={selected.has(user.id) ? "bg-slate-50" : undefined}>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(user.id)}
                    onChange={() => toggleOne(user.id)}
                    disabled={user.id === currentUserId}
                    aria-label={`Selecionar ${user.name}`}
                  />
                </td>
                <td className="px-4 py-2 text-slate-900">{user.name}</td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[user.role]}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
