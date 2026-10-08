"use client";

import { useState } from "react";
import { buttonGhost, buttonSecondary, inputBase } from "@/components/ui/styles";

export type ChecklistRow = { text: string; required: boolean };

/**
 * Editor das etapas padrão do serviço. As linhas viajam como um único campo
 * JSON (`name="checklist"`): arrays paralelos de texto e checkbox desalinham
 * assim que uma checkbox fica desmarcada, porque `FormData` simplesmente
 * omite a entrada.
 */
export function ChecklistEditor({ initial }: { initial: ChecklistRow[] }) {
  const [rows, setRows] = useState<ChecklistRow[]>(initial);

  function update(index: number, patch: Partial<ChecklistRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function remove(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="checklist" value={JSON.stringify(rows)} />

      {rows.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhuma etapa. Um serviço sem checklist funciona, mas a execução fica sem roteiro.
        </p>
      )}

      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-5 text-right text-xs text-slate-400">{index + 1}</span>
          <input
            value={row.text}
            onChange={(event) => update(index, { text: event.target.value })}
            placeholder="Descreva a etapa"
            className={`${inputBase} flex-1`}
            aria-label={`Etapa ${index + 1}`}
          />
          <label className="flex items-center gap-1.5 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={row.required}
              onChange={(event) => update(index, { required: event.target.checked })}
            />
            Obrigatória
          </label>
          <button
            type="button"
            onClick={() => move(index, -1)}
            disabled={index === 0}
            className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-30"
            aria-label={`Mover etapa ${index + 1} para cima`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(index, 1)}
            disabled={index === rows.length - 1}
            className="px-1 text-slate-400 hover:text-slate-900 disabled:opacity-30"
            aria-label={`Mover etapa ${index + 1} para baixo`}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => remove(index)}
            className={buttonGhost}
            aria-label={`Remover etapa ${index + 1}`}
          >
            Remover
          </button>
        </div>
      ))}

      <div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, { text: "", required: false }])}
          className={buttonSecondary}
        >
          Adicionar etapa
        </button>
      </div>

      <p className="text-xs text-slate-500">
        Alterar o checklist não mexe em atividade já gerada — cada uma guarda a própria cópia.
      </p>
    </div>
  );
}
