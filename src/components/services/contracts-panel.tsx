"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createServiceContractAction,
  toggleServiceContractAction,
  type ServiceFormState,
} from "@/lib/actions/services";
import { MONTH_NAMES, WEEKDAY_NAMES } from "@/lib/tasks/recurrence";
import { buttonGhost, buttonPrimary, buttonSecondary, inputBase } from "@/components/ui/styles";

const initialState: ServiceFormState = {};

export type ServiceOption = {
  id: string;
  name: string;
  scope: "EMPRESA" | "CONTA_BANCARIA" | "COLABORADOR";
  departmentName: string;
};

export type BankAccountOption = {
  id: string;
  bankName: string;
  agency: string;
  accountNumber: string;
};

export type ContractRow = {
  id: string;
  serviceName: string;
  scopeLabel: string | null;
  recurrence: string;
  assigneeName: string | null;
  targetOffsetDays: number;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
};

const NEEDS_WEEKDAY = ["SEMANAL", "QUINZENAL"];
const NEEDS_DAY_OF_MONTH = ["MENSAL", "TRIMESTRAL", "ANUAL"];
const NEEDS_MONTHS = ["TRIMESTRAL", "ANUAL"];

function NovoContratoForm({
  companyId,
  services,
  bankAccounts,
  assignees,
  onDone,
}: {
  companyId: string;
  services: ServiceOption[];
  bankAccounts: BankAccountOption[];
  assignees: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    createServiceContractAction.bind(null, companyId),
    initialState
  );
  const [serviceId, setServiceId] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("MENSAL");
  const [handledState, setHandledState] = useState(state);
  const formRef = useRef<HTMLFormElement>(null);

  // Os campos condicionais são controlados, então `form.reset()` não os limpa:
  // o estado é ajustado durante o render (mesmo padrão do painel de contas
  // bancárias) e o efeito cuida só do lado DOM, dos campos não controlados.
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      setServiceId("");
      setRecurrenceType("MENSAL");
    }
  }

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  const selected = services.find((service) => service.id === serviceId);
  const needsAccount = selected?.scope === "CONTA_BANCARIA";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Contratar serviço</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-6">
        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="serviceId" className="text-sm font-medium text-slate-700">
            Serviço
          </label>
          <select
            id="serviceId"
            name="serviceId"
            value={serviceId}
            onChange={(event) => setServiceId(event.target.value)}
            required
            className={inputBase}
          >
            <option value="">Selecione</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.departmentName})
              </option>
            ))}
          </select>
        </div>

        {needsAccount && (
          <div className="flex flex-col gap-1 sm:col-span-3">
            <label htmlFor="bankAccountId" className="text-sm font-medium text-slate-700">
              Conta bancária
            </label>
            <select id="bankAccountId" name="bankAccountId" required className={inputBase}>
              <option value="">Selecione</option>
              {bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bankName} · ag {account.agency} · cc {account.accountNumber}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Este serviço gera uma atividade por conta — contrate uma vez para cada.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="recurrenceType" className="text-sm font-medium text-slate-700">
            Periodicidade
          </label>
          <select
            id="recurrenceType"
            name="recurrenceType"
            value={recurrenceType}
            onChange={(event) => setRecurrenceType(event.target.value)}
            className={inputBase}
          >
            <option value="DIARIA">Diária (dias úteis)</option>
            <option value="SEMANAL">Semanal</option>
            <option value="QUINZENAL">Quinzenal</option>
            <option value="MENSAL">Mensal</option>
            <option value="TRIMESTRAL">Trimestral</option>
            <option value="ANUAL">Anual</option>
          </select>
        </div>

        {NEEDS_WEEKDAY.includes(recurrenceType) && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="weekday" className="text-sm font-medium text-slate-700">
              Dia da semana
            </label>
            <select id="weekday" name="weekday" defaultValue="1" className={inputBase}>
              {WEEKDAY_NAMES.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {NEEDS_DAY_OF_MONTH.includes(recurrenceType) && (
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor="dayOfMonth" className="text-sm font-medium text-slate-700">
              Dia do mês
            </label>
            <input
              id="dayOfMonth"
              name="dayOfMonth"
              type="number"
              min={1}
              max={31}
              defaultValue={5}
              className={inputBase}
            />
            <p className="text-xs text-slate-500">Meses curtos usam o último dia.</p>
          </div>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="deadlineTime" className="text-sm font-medium text-slate-700">
            Hora limite
          </label>
          <input
            id="deadlineTime"
            name="deadlineTime"
            type="time"
            defaultValue="18:00"
            required
            className={inputBase}
          />
          <p className="text-xs text-slate-500">O corte bancário mora aqui.</p>
        </div>

        {NEEDS_MONTHS.includes(recurrenceType) && (
          <fieldset className="flex flex-col gap-1 sm:col-span-6">
            <legend className="text-sm font-medium text-slate-700">Meses aplicáveis</legend>
            <div className="mt-1 flex flex-wrap gap-3">
              {MONTH_NAMES.map((month, index) => (
                <label key={month} className="flex items-center gap-1.5 text-sm text-slate-700">
                  <input type="checkbox" name="months" value={index + 1} />
                  {month}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="adjustment" className="text-sm font-medium text-slate-700">
            Se cair em dia não útil
          </label>
          <select id="adjustment" name="adjustment" defaultValue="POSTERGAR" className={inputBase}>
            <option value="POSTERGAR">Postergar para o próximo dia útil</option>
            <option value="ANTECIPAR">Antecipar para o dia útil anterior</option>
            <option value="MANTER">Manter a data</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="targetOffsetDays" className="text-sm font-medium text-slate-700">
            Meta interna (dias úteis antes)
          </label>
          <input
            id="targetOffsetDays"
            name="targetOffsetDays"
            type="number"
            min={0}
            max={30}
            defaultValue={1}
            className={inputBase}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="assigneeId" className="text-sm font-medium text-slate-700">
            Responsável padrão
          </label>
          <select id="assigneeId" name="assigneeId" className={inputBase}>
            <option value="">Sem responsável</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="startsOn" className="text-sm font-medium text-slate-700">
            Início da vigência
          </label>
          <input
            id="startsOn"
            name="startsOn"
            type="date"
            defaultValue={today}
            required
            className={inputBase}
          />
          <p className="text-xs text-slate-500">Não gera atividade com vencimento no passado.</p>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-3">
          <label htmlFor="endsOn" className="text-sm font-medium text-slate-700">
            Fim da vigência (opcional)
          </label>
          <input id="endsOn" name="endsOn" type="date" className={inputBase} />
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
          {pending ? "Contratando..." : "Contratar"}
        </button>
      </div>
    </form>
  );
}

export function ContractsPanel({
  companyId,
  services,
  bankAccounts,
  assignees,
  contracts,
}: {
  companyId: string;
  services: ServiceOption[];
  bankAccounts: BankAccountOption[];
  assignees: Array<{ id: string; name: string }>;
  contracts: ContractRow[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {contracts.length === 0
            ? "Nenhum serviço contratado ainda."
            : `${contracts.length} serviço(s) contratado(s).`}
        </p>
        {!adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            disabled={services.length === 0}
            className={buttonPrimary}
          >
            Contratar serviço
          </button>
        )}
      </div>

      {services.length === 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Nenhum serviço ativo no catálogo. Cadastre um no Catálogo de serviços antes de contratar.
        </p>
      )}

      {adding && (
        <NovoContratoForm
          companyId={companyId}
          services={services}
          bankAccounts={bankAccounts}
          assignees={assignees}
          onDone={() => setAdding(false)}
        />
      )}

      {contracts.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">Serviço</th>
                <th scope="col" className="px-4 py-2 font-medium">Escopo</th>
                <th scope="col" className="px-4 py-2 font-medium">Quando</th>
                <th scope="col" className="px-4 py-2 font-medium">Responsável</th>
                <th scope="col" className="px-4 py-2 font-medium">Vigência</th>
                <th scope="col" className="px-4 py-2 font-medium">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.map((contract) => (
                <tr key={contract.id} className={contract.active ? undefined : "opacity-60"}>
                  <td className="px-4 py-2 text-slate-900">
                    {contract.serviceName}
                    {!contract.active && (
                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{contract.scopeLabel ?? "Cliente"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {contract.recurrence}
                    <span className="block text-xs text-slate-400">
                      meta {contract.targetOffsetDays} dia(s) útil(eis) antes
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{contract.assigneeName ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {contract.startsOn}
                    {contract.endsOn ? ` a ${contract.endsOn}` : ""}
                  </td>
                  <td className="px-4 py-2">
                    <form action={toggleServiceContractAction.bind(null, contract.id)}>
                      <button type="submit" className={buttonGhost}>
                        {contract.active ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
