"use client";

import { useActionState } from "react";
import {
  createServiceAction,
  updateServiceAction,
  type ServiceFormState,
} from "@/lib/actions/services";
import { ChecklistEditor, type ChecklistRow } from "@/components/services/checklist-editor";
import { buttonPrimary, inputBase } from "@/components/ui/styles";

const initialState: ServiceFormState = {};

export type ServiceDefaults = {
  name: string;
  departmentId: string;
  nature: "RECORRENTE" | "SOB_DEMANDA";
  scope: "EMPRESA" | "CONTA_BANCARIA" | "COLABORADOR";
  estimatedMinutes: number | null;
  description: string | null;
  active: boolean;
  checklist: ChecklistRow[];
};

const EMPTY: ServiceDefaults = {
  name: "",
  departmentId: "",
  nature: "RECORRENTE",
  scope: "EMPRESA",
  estimatedMinutes: null,
  description: null,
  active: true,
  checklist: [],
};

export function ServiceForm({
  departments,
  serviceId,
  defaults = EMPTY,
}: {
  departments: Array<{ id: string; name: string }>;
  serviceId?: string;
  defaults?: ServiceDefaults;
}) {
  const [state, formAction, pending] = useActionState(
    serviceId ? updateServiceAction.bind(null, serviceId) : createServiceAction,
    initialState
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-6">
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-6">
        <div className="flex flex-col gap-1 sm:col-span-4">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nome do serviço
          </label>
          <input
            id="name"
            name="name"
            defaultValue={defaults.name}
            required
            maxLength={120}
            placeholder="Conciliação Bancária"
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="departmentId" className="text-sm font-medium text-slate-700">
            Departamento
          </label>
          <select
            id="departmentId"
            name="departmentId"
            defaultValue={defaults.departmentId}
            required
            className={inputBase}
          >
            <option value="">Selecione</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="nature" className="text-sm font-medium text-slate-700">
            Natureza
          </label>
          <select
            id="nature"
            name="nature"
            defaultValue={defaults.nature}
            className={inputBase}
          >
            <option value="RECORRENTE">Recorrente — gerada por calendário</option>
            <option value="SOB_DEMANDA">Sob demanda — criada caso a caso</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="scope" className="text-sm font-medium text-slate-700">
            Granularidade
          </label>
          <select id="scope" name="scope" defaultValue={defaults.scope} className={inputBase}>
            <option value="EMPRESA">Uma atividade por cliente</option>
            <option value="CONTA_BANCARIA">Uma atividade por conta bancária</option>
            <option value="COLABORADOR">Uma atividade por colaborador</option>
          </select>
          <p className="text-xs text-slate-500">
            Conciliação e pagamentos são por conta; folha e fechamento, por cliente.
          </p>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="estimatedMinutes" className="text-sm font-medium text-slate-700">
            Estimativa (minutos)
          </label>
          <input
            id="estimatedMinutes"
            name="estimatedMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={defaults.estimatedMinutes ?? ""}
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-6">
          <label htmlFor="description" className="text-sm font-medium text-slate-700">
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={defaults.description ?? ""}
            className={inputBase}
          />
        </div>

        {serviceId && (
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-6">
            <input type="checkbox" name="active" defaultChecked={defaults.active} />
            Serviço ativo (inativo não gera novas atividades)
          </label>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Checklist padrão</h2>
        <p className="mt-1 text-xs text-slate-500">
          Copiado para cada atividade no momento da geração.
        </p>
        <div className="mt-3">
          <ChecklistEditor initial={defaults.checklist} />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      )}

      <div>
        <button type="submit" disabled={pending} className={buttonPrimary}>
          {pending ? "Salvando..." : serviceId ? "Salvar serviço" : "Criar serviço"}
        </button>
      </div>
    </form>
  );
}
