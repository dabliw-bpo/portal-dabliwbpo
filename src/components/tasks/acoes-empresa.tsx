"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createDemandAction, type TaskActionState } from "@/lib/actions/tasks";
import { generateCompanyTasksAction, type ServiceFormState } from "@/lib/actions/services";
import { buttonPrimary, buttonSecondary, inputBase } from "@/components/ui/styles";

const taskInitial: TaskActionState = {};
const serviceInitial: ServiceFormState = {};

export type ServicoAvulso = {
  id: string;
  name: string;
  scope: "EMPRESA" | "CONTA_BANCARIA" | "COLABORADOR";
  departmentName: string;
};

export type ContaOpcao = { id: string; rotulo: string };

function NovaDemandaForm({
  companyId,
  servicos,
  contas,
  responsaveis,
  hoje,
  onDone,
}: {
  companyId: string;
  servicos: ServicoAvulso[];
  contas: ContaOpcao[];
  responsaveis: Array<{ id: string; name: string }>;
  hoje: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createDemandAction.bind(null, companyId),
    taskInitial
  );
  const [servicoId, setServicoId] = useState("");
  const [tratado, setTratado] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // O serviço é controlado (decide se aparece o campo da conta), então o reset
  // do formulário não o alcança: ajusta-se o estado durante a renderização.
  if (state !== tratado) {
    setTratado(state);
    if (state.success) setServicoId("");
  }

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  const servico = servicos.find((s) => s.id === servicoId);
  const precisaConta = servico?.scope === "CONTA_BANCARIA";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Nova demanda</h2>
      <p className="mt-1 text-xs text-slate-500">
        Para o que o cliente pede fora da rotina contratada. Ela entra na árvore no mês do
        vencimento.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-6">
        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="demanda-servico" className="text-sm font-medium text-slate-700">
            Serviço
          </label>
          <select
            id="demanda-servico"
            name="serviceId"
            value={servicoId}
            onChange={(e) => setServicoId(e.target.value)}
            required
            className={inputBase}
          >
            <option value="">Selecione</option>
            {servicos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.departmentName})
              </option>
            ))}
          </select>
        </div>

        {precisaConta && (
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="demanda-conta" className="text-sm font-medium text-slate-700">
              Conta bancária
            </label>
            <select id="demanda-conta" name="bankAccountId" required className={inputBase}>
              <option value="">Selecione</option>
              {contas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="demanda-data" className="text-sm font-medium text-slate-700">
            Vencimento
          </label>
          <input
            id="demanda-data"
            name="dueDate"
            type="date"
            defaultValue={hoje}
            required
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="demanda-hora" className="text-sm font-medium text-slate-700">
            Hora limite
          </label>
          <input
            id="demanda-hora"
            name="dueTime"
            type="time"
            defaultValue="18:00"
            required
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="demanda-origem" className="text-sm font-medium text-slate-700">
            Origem
          </label>
          <select id="demanda-origem" name="origin" defaultValue="SOLICITACAO_CLIENTE" className={inputBase}>
            <option value="SOLICITACAO_CLIENTE">Pedido do cliente</option>
            <option value="ORDEM_SERVICO">Ordem de serviço</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="demanda-resp" className="text-sm font-medium text-slate-700">
            Responsável
          </label>
          <select id="demanda-resp" name="assigneeId" className={inputBase}>
            <option value="">Sem responsável</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="demanda-nota" className="text-sm font-medium text-slate-700">
            Observação (opcional)
          </label>
          <input
            id="demanda-nota"
            name="note"
            maxLength={500}
            placeholder="O que o cliente pediu"
            className={inputBase}
          />
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={pending} className={buttonSecondary}>
          Fechar
        </button>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Abrindo..." : "Abrir demanda"}
        </button>
      </div>
    </form>
  );
}

/** Botões do topo da aba: abrir demanda avulsa e gerar as próximas recorrentes. */
export function AcoesEmpresa({
  companyId,
  servicos,
  contas,
  responsaveis,
  hoje,
}: {
  companyId: string;
  servicos: ServicoAvulso[];
  contas: ContaOpcao[];
  responsaveis: Array<{ id: string; name: string }>;
  /** Data de hoje (AAAA-MM-DD, Brasília) — vem do servidor para não divergir do fuso do navegador. */
  hoje: string;
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [geracao, gerar, gerando] = useActionState(
    generateCompanyTasksAction.bind(null, companyId),
    serviceInitial
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {!abrindo && (
          <button
            type="button"
            onClick={() => setAbrindo(true)}
            disabled={servicos.length === 0}
            className={buttonPrimary}
          >
            Nova demanda
          </button>
        )}
        <form action={gerar}>
          <button type="submit" disabled={gerando} className={buttonSecondary}>
            {gerando ? "Gerando..." : "Gerar próximas demandas"}
          </button>
        </form>
        {geracao.success && (
          <span className="text-sm text-emerald-700" role="status">
            {geracao.success}
          </span>
        )}
        {geracao.error && (
          <span className="text-sm text-red-600" role="alert">
            {geracao.error}
          </span>
        )}
      </div>

      {servicos.length === 0 && (
        <p className="text-xs text-slate-500">
          Nenhum serviço ativo no catálogo — cadastre um em Empresas → Catálogo de serviços.
        </p>
      )}

      {abrindo && (
        <NovaDemandaForm
          companyId={companyId}
          servicos={servicos}
          contas={contas}
          responsaveis={responsaveis}
          hoje={hoje}
          onDone={() => setAbrindo(false)}
        />
      )}
    </div>
  );
}
