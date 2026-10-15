"use client";

import { useActionState, useEffect, useRef } from "react";
import { uploadTimeClockFilesAction, type TimeClockState } from "@/lib/actions/time-clock";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: TimeClockState = {};

export type MesOpcao = { chave: string; rotulo: string };

/**
 * Envio de fotos ou arquivos do ponto de um mês. No celular, o seletor de
 * arquivos já oferece a câmera; o mês começa no atual e pode recuar para
 * mandar o de um mês anterior.
 */
export function PontoUpload({
  meses,
  mesPadrao,
  collaboratorUserId,
}: {
  meses: MesOpcao[];
  mesPadrao: string;
  /** Só o admin informa: envia em nome do colaborador. */
  collaboratorUserId?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadTimeClockFilesAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4 portal:rounded-none portal:border-fio portal:bg-cartao portal:p-6"
    >
      {collaboratorUserId && (
        <input type="hidden" name="collaboratorUserId" value={collaboratorUserId} />
      )}
      <h2 className="text-sm font-semibold text-slate-900 portal:font-serifa portal:text-2xl portal:font-medium portal:text-marfim">
        Enviar ponto
      </h2>
      <p className="mt-1 text-xs text-slate-500 portal:text-sm portal:text-areia">
        Fotos do cartão ou da folha de ponto, ou PDF. Até 10 arquivos por envio, 15 MB cada.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-6">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label
            htmlFor="referenceMonth"
            className="text-sm font-medium text-slate-700 portal:text-areia"
          >
            Mês do ponto
          </label>
          <select
            id="referenceMonth"
            name="referenceMonth"
            defaultValue={mesPadrao}
            required
            className={inputBase}
          >
            {meses.map((mes) => (
              <option key={mes.chave} value={mes.chave}>
                {mes.rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-4">
          <label htmlFor="files" className="text-sm font-medium text-slate-700 portal:text-areia">
            Fotos ou arquivos
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            required
            accept="image/*,application/pdf"
            className={inputBase}
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-600 portal:text-terracota" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 text-sm text-emerald-700 portal:text-salvia" role="status">
          {state.success}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
