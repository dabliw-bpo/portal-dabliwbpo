import Link from "next/link";
import { inputBase, buttonSecondary, buttonPrimary } from "@/components/ui/styles";
import { TASK_STATUS_LABELS } from "@/components/tasks/task-status-badge";
import type { QueueOptions, TaskFilters } from "@/lib/tasks/queries";

/**
 * Barra de filtros como formulário GET puro: sem JavaScript de cliente, e a
 * URL resultante é compartilhável — mandar "olha a fila do cliente X vencida"
 * é só copiar o endereço.
 */
export function Filtros({
  filters,
  options,
  currentUserId,
}: {
  filters: TaskFilters;
  options: QueueOptions;
  currentUserId: string;
}) {
  const otherAssignees = options.assignees.filter((a) => a.id !== currentUserId);

  return (
    <form
      method="get"
      className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3"
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Responsável</span>
        <select name="responsavel" defaultValue={filters.assignee} className={inputBase}>
          <option value="me">Minhas</option>
          <option value="all">Todos</option>
          <option value="none">Sem responsável</option>
          {otherAssignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Status</span>
        <select name="status" defaultValue={filters.status} className={inputBase}>
          <option value="open">Não concluídas</option>
          <option value="all">Todas</option>
          {(Object.keys(TASK_STATUS_LABELS) as Array<keyof typeof TASK_STATUS_LABELS>).map(
            (status) => (
              <option key={status} value={status}>
                {TASK_STATUS_LABELS[status]}
              </option>
            )
          )}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Cliente</span>
        <select name="cliente" defaultValue={filters.companyId ?? ""} className={inputBase}>
          <option value="">Todos</option>
          {options.companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Departamento</span>
        <select name="departamento" defaultValue={filters.departmentId ?? ""} className={inputBase}>
          <option value="">Todos</option>
          {options.departments.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-500">Serviço</span>
        <select name="servico" defaultValue={filters.serviceId ?? ""} className={inputBase}>
          <option value="">Todos</option>
          {options.services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        <button type="submit" className={buttonPrimary}>
          Filtrar
        </button>
        <Link href="/atividades" className={buttonSecondary}>
          Limpar
        </Link>
      </div>
    </form>
  );
}
