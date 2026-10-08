"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { TaskOrigin, TaskStatus } from "@prisma/client";
import {
  changeTaskStatusAction,
  completeTaskAction,
  toggleChecklistItemAction,
  type TaskActionState,
} from "@/lib/actions/tasks";
import { TASK_STATUS_LABELS } from "./task-status-badge";

const initialState: TaskActionState = {};

export type LinhaDemandaDados = {
  id: string;
  status: TaskStatus;
  origin: TaskOrigin;
  vencida: boolean;
  hoje: boolean;
  dia: string;
  diaSemana: string;
  prazo: string;
  responsavel: string | null;
  itens: Array<{ id: string; texto: string; obrigatorio: boolean; marcado: boolean }>;
  documentos: number;
  exigeDocumento: boolean;
};

const ORIGEM: Partial<Record<TaskOrigin, string>> = {
  ORDEM_SERVICO: "Ordem de serviço",
  SOLICITACAO_CLIENTE: "Pedido do cliente",
  EVENTO: "Evento",
};

/**
 * Uma demanda da árvore: data, caixa de conclusão e, se abrir, o checklist.
 *
 * A caixa conclui pela mesma regra da tela da atividade — checklist
 * obrigatório completo e, quando o serviço exige, documento anexado. Se a
 * regra barrar, o motivo aparece na própria linha em vez de a caixa marcar e
 * desmarcar sozinha.
 */
export function LinhaDemanda({ dados, voltar }: { dados: LinhaDemandaDados; voltar: string }) {
  const [aberta, setAberta] = useState(false);
  const [concluirState, concluirAction, concluindo] = useActionState(
    completeTaskAction,
    initialState
  );

  const concluida = dados.status === "CONCLUIDA";
  const cancelada = dados.status === "CANCELADA";
  const encerrada = concluida || cancelada;
  const feitos = dados.itens.filter((item) => item.marcado).length;
  const tom = concluida
    ? "text-slate-400"
    : cancelada
      ? "text-slate-400 line-through"
      : dados.vencida
        ? "font-medium text-red-700"
        : dados.hoje
          ? "font-medium text-amber-700"
          : "text-slate-900";

  return (
    <li className="py-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {concluida ? (
          <form action={changeTaskStatusAction}>
            <input type="hidden" name="taskId" value={dados.id} />
            <input type="hidden" name="status" value="EM_ANDAMENTO" />
            <button
              type="submit"
              title="Concluída — clique para reabrir"
              className="flex h-5 w-5 items-center justify-center rounded border border-emerald-600 bg-emerald-600 text-xs leading-none text-white hover:bg-emerald-700"
            >
              ✓
              <span className="sr-only">
                Demanda de {dados.dia} concluída. Reabrir.
              </span>
            </button>
          </form>
        ) : cancelada ? (
          <span
            title="Cancelada"
            className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-slate-50 text-xs leading-none text-slate-400"
          >
            –<span className="sr-only">Demanda de {dados.dia} cancelada.</span>
          </span>
        ) : (
          <form action={concluirAction}>
            <input type="hidden" name="taskId" value={dados.id} />
            <button
              type="submit"
              disabled={concluindo}
              title="Marcar como concluída"
              className="flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-xs leading-none text-transparent hover:border-emerald-600 hover:text-emerald-600 disabled:opacity-50"
            >
              ✓<span className="sr-only">Concluir demanda de {dados.dia}</span>
            </button>
          </form>
        )}

        <span className={`w-24 text-sm tabular-nums ${tom}`} title={`Prazo legal: ${dados.prazo}`}>
          {dados.dia}
          <span className="ml-1.5 text-xs font-normal text-slate-400">{dados.diaSemana}</span>
        </span>

        {dados.vencida && !encerrada && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            Vencida
          </span>
        )}
        {(dados.status === "EM_ANDAMENTO" || dados.status === "AGUARDANDO_CLIENTE") && (
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
            {TASK_STATUS_LABELS[dados.status]}
          </span>
        )}
        {ORIGEM[dados.origin] && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
            {ORIGEM[dados.origin]}
          </span>
        )}

        {dados.itens.length > 0 && (
          <button
            type="button"
            onClick={() => setAberta((v) => !v)}
            aria-expanded={aberta}
            className="text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
          >
            {aberta ? "Ocultar etapas" : `Etapas ${feitos}/${dados.itens.length}`}
          </button>
        )}
        {dados.exigeDocumento && (
          <span className="text-xs text-slate-400">
            {dados.documentos > 0 ? `${dados.documentos} anexo(s)` : "exige anexo"}
          </span>
        )}

        <span className="ml-auto flex items-center gap-3 text-xs text-slate-400">
          {dados.responsavel ?? "Sem responsável"}
          <Link
            href={`/atividades/${dados.id}?voltar=${encodeURIComponent(voltar)}`}
            className="text-slate-500 underline hover:text-slate-900"
          >
            Abrir
          </Link>
        </span>
      </div>

      {concluirState.error && (
        <p className="ml-8 mt-1 text-xs text-red-600" role="alert">
          {concluirState.error}{" "}
          <button
            type="button"
            onClick={() => setAberta(true)}
            className="underline hover:text-red-800"
          >
            Ver etapas
          </button>
        </p>
      )}

      {aberta && dados.itens.length > 0 && (
        <ul className="ml-8 mt-1.5 flex flex-col gap-1 border-l border-slate-200 pl-3">
          {dados.itens.map((item) => (
            <li key={item.id}>
              <form action={toggleChecklistItemAction} className="flex items-start gap-2">
                <input type="hidden" name="taskId" value={dados.id} />
                <input type="hidden" name="itemId" value={item.id} />
                <button
                  type="submit"
                  disabled={encerrada}
                  aria-pressed={item.marcado}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none disabled:cursor-not-allowed disabled:opacity-60 ${
                    item.marcado
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 bg-white hover:border-slate-500"
                  }`}
                >
                  {item.marcado ? "✓" : ""}
                  <span className="sr-only">
                    {item.marcado ? "Desmarcar" : "Marcar"} {item.texto}
                  </span>
                </button>
                <span
                  className={`text-sm ${item.marcado ? "text-slate-400 line-through" : "text-slate-700"}`}
                >
                  {item.texto}
                  {item.obrigatorio && (
                    <span className="ml-1 text-xs text-red-600" title="Obrigatório">
                      *
                    </span>
                  )}
                </span>
              </form>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
