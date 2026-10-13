"use client";

import { useActionState, useState } from "react";
import {
  deleteSeriesAction,
  reassignTasksAction,
  type TaskActionState,
} from "@/lib/actions/tasks";
import { buttonDanger, buttonPrimary, buttonSecondary, inputBase } from "@/components/ui/styles";

const initialState: TaskActionState = {};

type Painel = "responsavel" | "excluir" | null;

/**
 * Ações em lote de uma conta (ou de um serviço inteiro): trocar o responsável
 * de todas as demandas em aberto de uma vez e excluir a série. Ficam recolhidas
 * até serem pedidas, para a árvore continuar legível.
 *
 * "Excluir a série" cancela as demandas em aberto com motivo e desativa o
 * contrato; as concluídas permanecem. Por isso o texto de confirmação diz o
 * número exato de demandas e o que mais acontece.
 */
export function AcoesSerie({
  companyId,
  serviceId,
  bankAccountId,
  rotulo,
  abertas,
  atuais,
  responsaveis,
  permitirExcluir = true,
}: {
  companyId: string;
  serviceId: string;
  /** "-" ou vazio: serviço sem conta; ausente no nível do serviço (todas as contas). */
  bankAccountId: string | null;
  /** Do que se está falando, para o texto de confirmação. */
  rotulo: string;
  abertas: number;
  /** Responsáveis atuais das demandas em aberto. */
  atuais: string[];
  responsaveis: Array<{ id: string; name: string }>;
  permitirExcluir?: boolean;
}) {
  const [painel, setPainel] = useState<Painel>(null);
  const [trocaState, trocaAction, trocando] = useActionState(reassignTasksAction, initialState);
  const [excluiState, excluiAction, excluindo] = useActionState(deleteSeriesAction, initialState);

  const alternar = (alvo: Exclude<Painel, null>) => setPainel((atual) => (atual === alvo ? null : alvo));

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span>
          Responsável:{" "}
          <span className="text-slate-700">
            {atuais.length === 0 ? "—" : atuais.length === 1 ? atuais[0] : `${atuais.length} pessoas`}
          </span>
        </span>
        <button
          type="button"
          onClick={() => alternar("responsavel")}
          aria-expanded={painel === "responsavel"}
          className="underline underline-offset-2 hover:text-slate-900"
        >
          Alterar responsável de todas
        </button>
        {permitirExcluir && (
          <button
            type="button"
            onClick={() => alternar("excluir")}
            aria-expanded={painel === "excluir"}
            className="text-red-700 underline underline-offset-2 hover:text-red-900"
          >
            Excluir toda a tarefa
          </button>
        )}
      </div>

      {painel === "responsavel" && (
        <form
          action={trocaAction}
          className="flex flex-wrap items-end gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="serviceId" value={serviceId} />
          {bankAccountId && <input type="hidden" name="bankAccountId" value={bankAccountId} />}
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Novo responsável
            <select name="assigneeId" defaultValue="" className={`${inputBase} min-w-56`}>
              <option value="">Sem responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={trocando} className={buttonPrimary}>
            {trocando ? "Alterando..." : `Aplicar às ${abertas} em aberto`}
          </button>
          <p className="basis-full text-xs text-slate-500">
            {rotulo}: vale para as demandas em aberto e para as próximas que forem geradas.
          </p>
          {trocaState.error && (
            <p className="basis-full text-sm text-red-600" role="alert">
              {trocaState.error}
            </p>
          )}
          {trocaState.success && (
            <p className="basis-full text-sm text-emerald-700" role="status">
              {trocaState.success}
            </p>
          )}
        </form>
      )}

      {painel === "excluir" && permitirExcluir && (
        <form
          action={excluiAction}
          className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3"
        >
          <input type="hidden" name="companyId" value={companyId} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="bankAccountId" value={bankAccountId ?? ""} />
          <p className="text-sm text-red-900">
            Vai excluir as <strong>{abertas}</strong> demandas em aberto de {rotulo} e desativar o
            contrato, para não surgirem novas. As já concluídas ficam.
          </p>
          <label className="flex flex-col gap-1 text-xs font-medium text-red-900">
            Motivo da exclusão
            <textarea
              name="reason"
              required
              minLength={3}
              maxLength={300}
              rows={2}
              className={inputBase}
              placeholder="Ex.: conta encerrada pelo cliente"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={excluindo}
              className={`${buttonDanger} border border-red-300 bg-white`}
            >
              {excluindo ? "Excluindo..." : `Excluir ${abertas} demandas`}
            </button>
            <button type="button" onClick={() => setPainel(null)} className={buttonSecondary}>
              Cancelar
            </button>
          </div>
          {excluiState.error && (
            <p className="text-sm text-red-600" role="alert">
              {excluiState.error}
            </p>
          )}
          {excluiState.success && (
            <p className="text-sm text-emerald-700" role="status">
              {excluiState.success}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
