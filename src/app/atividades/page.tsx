import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDeadlineShort } from "@/lib/format";
import {
  checklistProgress,
  listQueueTasks,
  parseFilters,
  taskScopeLabel,
  type QueueTask,
} from "@/lib/tasks/queries";
import { periodLabel } from "@/lib/tasks/recurrence";
import { URGENCY_LABEL, URGENCY_ORDER, urgencyOf, type Urgency } from "@/lib/tasks/urgency";
import { TaskStatusBadge } from "@/components/tasks/task-status-badge";
import { Filtros } from "./filtros";

const GROUP_STYLES: Record<Urgency, { dot: string; heading: string }> = {
  VENCIDA: { dot: "bg-red-500", heading: "text-red-700" },
  HOJE: { dot: "bg-amber-500", heading: "text-amber-700" },
  EM_RISCO: { dot: "bg-orange-400", heading: "text-orange-700" },
  ESTA_SEMANA: { dot: "bg-slate-400", heading: "text-slate-700" },
  DEPOIS: { dot: "bg-slate-300", heading: "text-slate-600" },
};

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const filters = parseFilters(params);
  const { tasks, options } = await listQueueTasks(session, filters);

  const now = new Date();
  const groups = new Map<Urgency, QueueTask[]>();
  for (const task of tasks) {
    const urgency = urgencyOf(task, now);
    const bucket = groups.get(urgency);
    if (bucket) {
      bucket.push(task);
    } else {
      groups.set(urgency, [task]);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Atividades</h1>
        <span className="text-sm text-slate-500">
          {tasks.length} {tasks.length === 1 ? "atividade" : "atividades"}
        </span>
      </div>

      <Filtros filters={filters} options={options} currentUserId={session.user.id} />

      {tasks.length === 0 ? (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Nenhuma atividade com esses filtros.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {URGENCY_ORDER.filter((urgency) => groups.has(urgency)).map((urgency) => {
            const bucket = groups.get(urgency) ?? [];
            const style = GROUP_STYLES[urgency];
            return (
              <section key={urgency}>
                <h2
                  className={`flex items-center gap-2 text-sm font-semibold ${style.heading}`}
                >
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden />
                  {URGENCY_LABEL[urgency]}
                  <span className="font-normal text-slate-500">({bucket.length})</span>
                </h2>

                <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {bucket.map((task) => {
                    const scope = taskScopeLabel(task);
                    const progress = checklistProgress(task.checklist);
                    return (
                      <li key={task.id}>
                        <Link
                          href={`/atividades/${task.id}`}
                          className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors hover:bg-slate-50"
                        >
                          <span className="font-medium text-slate-900">{task.service.name}</span>
                          <span className="text-slate-400" aria-hidden>
                            ·
                          </span>
                          <span className="text-sm text-slate-700">{task.company.name}</span>
                          {scope && (
                            <>
                              <span className="text-slate-400" aria-hidden>
                                ·
                              </span>
                              <span className="text-sm text-slate-500">{scope}</span>
                            </>
                          )}

                          <span className="ml-auto flex items-center gap-3 text-sm">
                            <span className="text-slate-500">
                              {periodLabel(
                                task.contract?.recurrenceType ?? "MENSAL",
                                task.periodStart,
                                task.periodEnd
                              )}
                            </span>
                            <span className="text-slate-500">
                              {progress.done}/{progress.total}
                            </span>
                            <span
                              className={
                                urgency === "VENCIDA"
                                  ? "font-medium text-red-700"
                                  : "text-slate-600"
                              }
                            >
                              {formatDeadlineShort(task.dueDateLegal)}
                            </span>
                            <TaskStatusBadge status={task.status} />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
