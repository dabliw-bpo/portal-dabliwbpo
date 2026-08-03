"use client";

import { useActionState, useMemo, useState } from "react";
import type { Company, User } from "@prisma/client";
import { deleteUsersAction, type DeleteUsersState } from "@/lib/actions/users";
import { buttonGhost } from "@/components/ui/styles";
import { Avatar } from "@/components/ui/avatar";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COMPANY_HR: "RH da empresa",
  COLLABORATOR: "Colaborador",
  CLIENT: "Cliente",
};

type UserRow = User & { company: Company | null; avatarUrl: string | null };
type SortDirection = "asc" | "desc";

const initialState: DeleteUsersState = {};

export function UsuariosTable({
  users,
  currentUserId,
  basePath = "/admin/usuarios",
  showCompanyColumn = true,
  editRedirectTo,
}: {
  users: UserRow[];
  currentUserId: string;
  basePath?: string;
  showCompanyColumn?: boolean;
  editRedirectTo?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [state, formAction, pending] = useActionState(deleteUsersAction, initialState);

  const [lastHandledSuccess, setLastHandledSuccess] = useState(state.success);
  if (state.success !== lastHandledSuccess) {
    setLastHandledSuccess(state.success);
    if (state.success) {
      setSelected(new Set());
      setConfirmingDelete(false);
    }
  }

  const sortedUsers = useMemo(() => {
    const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });
    return [...users].sort((a, b) =>
      sortDirection === "asc" ? collator.compare(a.name, b.name) : collator.compare(b.name, a.name)
    );
  }, [users, sortDirection]);

  const selectableIds = users.filter((user) => user.id !== currentUserId).map((user) => user.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const columnCount = showCompanyColumn ? 7 : 6;
  const editHref = `${basePath}/${[...selected][0]}/editar${
    editRedirectTo ? `?returnTo=${encodeURIComponent(editRedirectTo)}` : ""
  }`;

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

  function toggleSort() {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  return (
    <div className="mt-6">
      {selected.size > 0 && !confirmingDelete && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-sm text-slate-600">{selected.size} selecionado(s)</span>
          {selected.size === 1 && (
            <a href={editHref} className={buttonGhost}>
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
            {editRedirectTo && <input type="hidden" name="redirectTo" value={editRedirectTo} />}
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
                <button
                  type="button"
                  onClick={toggleSort}
                  className="flex items-center gap-1 font-medium text-slate-500 hover:text-slate-900"
                >
                  Nome
                  <span aria-hidden>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  <span className="sr-only">
                    {sortDirection === "asc" ? "Ordenado de A a Z. Clique para inverter." : "Ordenado de Z a A. Clique para inverter."}
                  </span>
                </button>
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                WhatsApp
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Papel
              </th>
              {showCompanyColumn && (
                <th scope="col" className="px-4 py-2 font-medium">
                  Empresa
                </th>
              )}
              <th scope="col" className="px-4 py-2 font-medium">
                Ativo
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedUsers.map((user) => (
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
                <td className="px-4 py-2 text-slate-900">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} src={user.avatarUrl} size={26} />
                    {user.name}
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2 text-slate-600">{user.whatsapp ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[user.role]}</td>
                {showCompanyColumn && (
                  <td className="px-4 py-2 text-slate-600">{user.company?.name ?? "-"}</td>
                )}
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-600">
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
