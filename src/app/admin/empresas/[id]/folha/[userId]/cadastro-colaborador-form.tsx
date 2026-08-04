"use client";

import { useActionState, useRef, useState } from "react";
import { updateUserAction, type UpdateUserState } from "@/lib/actions/users";
import { buttonPrimary, buttonSecondary, inputToggleable } from "@/components/ui/styles";

const initialState: UpdateUserState = {};

const ROLE_OPTIONS = [
  { value: "COLLABORATOR", label: "Colaborador" },
  { value: "COMPANY_HR", label: "RH da empresa" },
  { value: "CLIENT", label: "Cliente" },
] as const;

export function CadastroColaboradorForm({
  userId,
  companyId,
  values,
}: {
  userId: string;
  companyId: string;
  values: {
    name: string;
    email: string;
    whatsapp: string;
    role: string;
    active: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateUserAction.bind(null, userId),
    initialState
  );
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [handledState, setHandledState] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setEditing(false);
      setDirty(false);
    }
  }

  function cancel() {
    formRef.current?.reset();
    setEditing(false);
    setDirty(false);
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onChange={() => setDirty(true)}
      className="mt-6 flex flex-col gap-4"
    >
      <input type="hidden" name="inline" value="1" />
      <input type="hidden" name="companyId" value={companyId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {editing
            ? dirty
              ? "Há alterações não salvas."
              : "Altere os campos necessários e salve."
            : "Dados cadastrais da pessoa."}
        </p>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button type="button" onClick={cancel} disabled={pending} className={buttonSecondary}>
                Cancelar
              </button>
              <button type="submit" disabled={pending || !dirty} className={buttonPrimary}>
                {pending ? "Salvando..." : "Salvar alterações"}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className={buttonSecondary}>
              Editar
            </button>
          )}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && !editing && (
        <p className="text-sm text-emerald-700" role="status">
          Cadastro salvo.
        </p>
      )}

      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Identificação
        </legend>
        <div className="mt-2 grid gap-4 sm:grid-cols-6">
          <div className="flex flex-col gap-1 sm:col-span-6">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={values.name}
              disabled={!editing}
              className={inputToggleable}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={values.email}
              disabled={!editing}
              className={inputToggleable}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="whatsapp" className="text-sm font-medium text-slate-700">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              defaultValue={values.whatsapp}
              disabled={!editing}
              placeholder="(65) 99999-9999"
              className={inputToggleable}
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Papel
            </label>
            <select
              id="role"
              name="role"
              defaultValue={values.role}
              disabled={!editing}
              className={inputToggleable}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Nova senha (opcional)
            </label>
            <input
              id="password"
              name="password"
              type="password"
              minLength={10}
              disabled={!editing}
              placeholder={editing ? "Deixe em branco para manter" : ""}
              className={inputToggleable}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-6">
            <input
              type="checkbox"
              name="active"
              defaultChecked={values.active}
              disabled={!editing}
            />
            Acesso ativo
          </label>
        </div>
      </fieldset>
    </form>
  );
}
