"use client";

import { useMemo, useState } from "react";
import { FilePdf, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { deleteTimeClockFileAction } from "@/lib/actions/time-clock";
import { DeleteButton } from "@/components/ui/delete-button";
import { inputBase } from "@/components/ui/styles";

export type PontoArquivo = {
  id: string;
  /** Mês de referência, "AAAA-MM". */
  mes: string;
  nome: string;
  tamanho: string;
  enviadoEm: string;
  enviadoPor: string;
  ehPdf: boolean;
  podeExcluir: boolean;
};

export type PontoMes = {
  chave: string;
  ano: number;
  numero: number;
  rotulo: string;
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type Situacao = "todos" | "com" | "sem";

/**
 * Os envios de ponto organizados Ano → Mês, com filtros na própria página:
 * ano, mês e situação (com envio ou sem envio). Mostra também os meses em que
 * nada foi enviado — é o que faz dela um controle e não só uma lista.
 *
 * O filtro é de cliente (os dados de um colaborador são poucos), então trocar
 * de mês não navega para outro endereço.
 */
export function PontoEnvios({
  arquivos,
  meses,
}: {
  arquivos: PontoArquivo[];
  meses: PontoMes[];
}) {
  const anos = useMemo(() => [...new Set(meses.map((mes) => mes.ano))].sort((a, b) => b - a), [meses]);
  const [ano, setAno] = useState<string>("todos");
  const [mes, setMes] = useState<string>("todos");
  const [situacao, setSituacao] = useState<Situacao>("todos");

  const porMes = useMemo(() => {
    const mapa = new Map<string, PontoArquivo[]>();
    for (const arquivo of arquivos) {
      mapa.set(arquivo.mes, [...(mapa.get(arquivo.mes) ?? []), arquivo]);
    }
    return mapa;
  }, [arquivos]);

  const visiveis = meses.filter((item) => {
    if (ano !== "todos" && String(item.ano) !== ano) return false;
    if (mes !== "todos" && String(item.numero) !== mes) return false;
    const total = porMes.get(item.chave)?.length ?? 0;
    if (situacao === "com" && total === 0) return false;
    if (situacao === "sem" && total > 0) return false;
    return true;
  });

  const grupos = anos
    .map((anoItem) => ({
      ano: anoItem,
      meses: visiveis.filter((item) => item.ano === anoItem),
    }))
    .filter((grupo) => grupo.meses.length > 0);

  const filtrando = ano !== "todos" || mes !== "todos" || situacao !== "todos";
  const campo = "flex flex-col gap-1 text-xs font-medium text-slate-500 portal:text-areia";

  return (
    <section aria-label="Envios de ponto por mês" className="mt-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 portal:rounded-none portal:border-fio portal:bg-cartao">
        <label className={campo}>
          Ano
          <select value={ano} onChange={(e) => setAno(e.target.value)} className={`${inputBase} min-w-28`}>
            <option value="todos">Todos</option>
            {anos.map((anoItem) => (
              <option key={anoItem} value={anoItem}>
                {anoItem}
              </option>
            ))}
          </select>
        </label>
        <label className={campo}>
          Mês
          <select value={mes} onChange={(e) => setMes(e.target.value)} className={`${inputBase} min-w-36`}>
            <option value="todos">Todos</option>
            {MESES.map((nome, index) => (
              <option key={nome} value={index + 1}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <label className={campo}>
          Situação
          <select
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as Situacao)}
            className={`${inputBase} min-w-36`}
          >
            <option value="todos">Todos</option>
            <option value="com">Com envio</option>
            <option value="sem">Sem envio</option>
          </select>
        </label>
        {filtrando && (
          <button
            type="button"
            onClick={() => {
              setAno("todos");
              setMes("todos");
              setSituacao("todos");
            }}
            className="pb-2 text-sm text-slate-600 underline hover:text-slate-900 portal:text-areia portal:hover:text-ouro"
          >
            Limpar filtros
          </button>
        )}
        <p className="ml-auto pb-2 text-sm text-slate-500 portal:text-areia" aria-live="polite">
          {visiveis.length === 1 ? "1 mês" : `${visiveis.length} meses`}
        </p>
      </div>

      {grupos.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600 portal:rounded-none portal:border-fio portal:bg-transparent portal:text-areia">
          Nenhum mês corresponde aos filtros.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {grupos.map((grupo) => {
            const totalAno = grupo.meses.reduce(
              (soma, item) => soma + (porMes.get(item.chave)?.length ?? 0),
              0
            );
            return (
              <div key={grupo.ano}>
                <h3 className="flex items-baseline gap-3 border-b border-slate-200 pb-2 text-base font-semibold text-slate-900 portal:border-fio portal:font-serifa portal:text-3xl portal:font-medium portal:text-marfim">
                  {grupo.ano}
                  <span className="text-xs font-normal text-slate-500 portal:font-sans portal:text-sm portal:text-areia">
                    {totalAno === 1 ? "1 arquivo" : `${totalAno} arquivos`}
                  </span>
                </h3>

                <ul className="mt-2 flex flex-col gap-3">
                  {grupo.meses.map((item) => {
                    const doMes = porMes.get(item.chave) ?? [];
                    return (
                      <li
                        key={item.chave}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white portal:rounded-none portal:border-fio portal:bg-cartao"
                      >
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <h4 className="text-sm font-medium text-slate-900 portal:text-marfim">
                            {item.rotulo}
                          </h4>
                          {doMes.length > 0 ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 portal:rounded-none portal:bg-salvia/20 portal:text-salvia">
                              {doMes.length === 1 ? "1 arquivo" : `${doMes.length} arquivos`}
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 portal:rounded-none portal:bg-ouro/15 portal:text-ouro">
                              Sem envio
                            </span>
                          )}
                        </div>

                        {doMes.length > 0 && (
                          <ul className="divide-y divide-slate-100 border-t border-slate-100 portal:divide-fio portal:border-fio">
                            {doMes.map((arquivo) => (
                              <li
                                key={arquivo.id}
                                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5"
                              >
                                {arquivo.ehPdf ? (
                                  <FilePdf size={20} aria-hidden className="shrink-0 text-slate-400 portal:text-ouro" />
                                ) : (
                                  <ImageSquare size={20} aria-hidden className="shrink-0 text-slate-400 portal:text-ouro" />
                                )}
                                <a
                                  href={`/api/ponto/${arquivo.id}/arquivo`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-w-0 flex-1 truncate text-sm text-slate-900 underline hover:text-slate-700 portal:text-marfim portal:hover:text-ouro"
                                >
                                  {arquivo.nome}
                                </a>
                                <span className="text-xs text-slate-500 portal:text-areia">
                                  {arquivo.tamanho} · enviado em {arquivo.enviadoEm} por{" "}
                                  {arquivo.enviadoPor}
                                </span>
                                {arquivo.podeExcluir && (
                                  <DeleteButton
                                    action={deleteTimeClockFileAction}
                                    hidden={{ fileId: arquivo.id }}
                                    question="Excluir este arquivo?"
                                  />
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
