"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createBankAccountAction,
  deleteBankAccountAction,
  updateBankAccountAction,
  type BankAccountFormState,
} from "@/lib/actions/companies";
import {
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  inputToggleable,
} from "@/components/ui/styles";
import { CopyButton } from "@/components/ui/copy-button";

export type BankAccountRow = {
  id: string;
  bankName: string;
  bankCode: string | null;
  agency: string;
  accountNumber: string;
  cnpj: string | null;
  pixKey: string | null;
};

const initialState: BankAccountFormState = {};

const emptyAccount = {
  bankName: "",
  bankCode: "",
  agency: "",
  accountNumber: "",
  cnpj: "",
  pixKey: "",
};

function Field({
  id,
  name,
  label,
  value,
  disabled,
  required,
  placeholder,
  className,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        defaultValue={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={inputToggleable}
      />
    </div>
  );
}

/**
 * O bloco que se cola numa conversa para pedir um pagamento. Sai com a razão
 * social no topo, e campos vazios não viram linhas em branco.
 */
function accountAsText(companyName: string, account: BankAccountRow): string {
  const bank = account.bankCode ? `${account.bankCode} - ${account.bankName}` : account.bankName;

  return [
    companyName,
    `Banco: ${bank}`,
    `Agência: ${account.agency}`,
    `Conta: ${account.accountNumber}`,
    account.cnpj ? `CNPJ: ${account.cnpj}` : null,
    account.pixKey ? `PIX: ${account.pixKey}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** The six bank-account fields, shared by the "add" form and each account card. */
function BankAccountFields({
  idPrefix,
  values,
  disabled,
}: {
  idPrefix: string;
  values: typeof emptyAccount;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field
        id={`${idPrefix}-bankCode`}
        name="bankCode"
        label="Código do banco"
        value={values.bankCode}
        disabled={disabled}
        placeholder="341"
        className="sm:col-span-2"
      />
      <Field
        id={`${idPrefix}-bankName`}
        name="bankName"
        label="Banco"
        value={values.bankName}
        disabled={disabled}
        required
        placeholder="Itaú Unibanco"
        className="sm:col-span-4"
      />
      <Field
        id={`${idPrefix}-agency`}
        name="agency"
        label="Agência"
        value={values.agency}
        disabled={disabled}
        required
        placeholder="0000"
        className="sm:col-span-2"
      />
      <Field
        id={`${idPrefix}-accountNumber`}
        name="accountNumber"
        label="Conta"
        value={values.accountNumber}
        disabled={disabled}
        required
        placeholder="00000-0"
        className="sm:col-span-2"
      />
      <Field
        id={`${idPrefix}-cnpj`}
        name="cnpj"
        label="CNPJ do titular"
        value={values.cnpj}
        disabled={disabled}
        placeholder="00.000.000/0000-00"
        className="sm:col-span-2"
      />
      <Field
        id={`${idPrefix}-pixKey`}
        name="pixKey"
        label="Chave PIX"
        value={values.pixKey}
        disabled={disabled}
        className="sm:col-span-6"
      />
    </div>
  );
}

function NewBankAccountForm({ companyId, onDone }: { companyId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(
    createBankAccountAction.bind(null, companyId),
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Nova conta bancária</h2>
      <div className="mt-4">
        <BankAccountFields idPrefix="new" values={emptyAccount} />
      </div>
      {state.error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={pending} className={buttonSecondary}>
          Cancelar
        </button>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Salvando..." : "Adicionar conta"}
        </button>
      </div>
    </form>
  );
}

function BankAccountCard({
  account,
  companyName,
}: {
  account: BankAccountRow;
  companyName: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateBankAccountAction.bind(null, account.id),
    initialState
  );
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [handledState, setHandledState] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Adjust state during render (rather than in an effect) once the action
  // reports a save, so the card drops back to read-only.
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

  const values = {
    bankName: account.bankName,
    bankCode: account.bankCode ?? "",
    agency: account.agency,
    accountNumber: account.accountNumber,
    cnpj: account.cnpj ?? "",
    pixKey: account.pixKey ?? "",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <form ref={formRef} action={formAction} onChange={() => setDirty(true)}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {account.bankCode ? `${account.bankCode} - ` : ""}
            {account.bankName}
          </h2>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancel}
                  disabled={pending}
                  className={buttonSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={pending || !dirty} className={buttonPrimary}>
                  {pending ? "Salvando..." : "Salvar alterações"}
                </button>
              </>
            ) : (
              <>
                <CopyButton
                  value={accountAsText(companyName, account)}
                  label="os dados desta conta"
                  text="Copiar dados"
                />
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className={buttonSecondary}
                >
                  Editar
                </button>
              </>
            )}
          </div>
        </div>

        {state.error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <div className="mt-4">
          <BankAccountFields idPrefix={account.id} values={values} disabled={!editing} />
        </div>
      </form>

      {!editing && (
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
          {confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-700">Excluir esta conta bancária?</span>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className={buttonSecondary}
              >
                Cancelar
              </button>
              <form action={deleteBankAccountAction.bind(null, account.id)}>
                <button type="submit" className={buttonDanger}>
                  Confirmar exclusão
                </button>
              </form>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className={buttonDanger}
            >
              Excluir
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function BankAccountsPanel({
  companyId,
  companyName,
  accounts,
}: {
  companyId: string;
  /** Razão social, copiada junto com os dados da conta. */
  companyName: string;
  accounts: BankAccountRow[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {accounts.length === 0
            ? "Nenhuma conta bancária cadastrada ainda."
            : `${accounts.length} conta(s) cadastrada(s).`}
        </p>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className={buttonPrimary}>
            Adicionar conta bancária
          </button>
        )}
      </div>

      {adding && <NewBankAccountForm companyId={companyId} onDone={() => setAdding(false)} />}

      {accounts.map((account) => (
        <BankAccountCard key={account.id} account={account} companyName={companyName} />
      ))}
    </div>
  );
}
