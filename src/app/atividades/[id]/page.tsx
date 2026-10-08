import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatDeadline } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { changeTaskStatusAction, toggleChecklistItemAction } from "@/lib/actions/tasks";
import { taskScopeFor } from "@/lib/tasks/scope";
import { periodLabel } from "@/lib/tasks/recurrence";
import { URGENCY_LABEL, urgencyOf } from "@/lib/tasks/urgency";
import { ALLOWED_TRANSITIONS } from "@/lib/validations/task";
import { TaskStatusBadge, TASK_STATUS_LABELS } from "@/components/tasks/task-status-badge";
import { buttonSecondary } from "@/components/ui/styles";
import { PainelConclusao } from "./painel-conclusao";

/**
 * A tela serve a fila e a árvore de cada empresa. Quem chega pela árvore traz
 * `?voltar=`; só caminhos da própria aba são aceitos, para o parâmetro não
 * virar redirecionamento aberto.
 */
function destinoDeVolta(raw: string | string[] | undefined): { href: string; rotulo: string } {
  const valor = Array.isArray(raw) ? raw[0] : raw;
  if (
    valor &&
    (/^\/admin\/empresas\/[A-Za-z0-9_-]+\/tarefas$/.test(valor) ||
      /^\/atividades\/empresas\/[A-Za-z0-9_-]+$/.test(valor))
  ) {
    return { href: valor, rotulo: "← Voltar para as tarefas da empresa" };
  }
  return { href: "/atividades", rotulo: "← Voltar para a fila" };
}

export default async function AtividadeDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const voltar = destinoDeVolta((await searchParams).voltar);
  const scope = await taskScopeFor(session);

  // O recorte de papel entra na própria busca: uma atividade fora do escopo
  // do usuário é indistinguível de uma que não existe.
  const task = await prisma.task.findFirst({
    where: { AND: [{ id }, scope] },
    include: {
      company: { select: { id: true, name: true, cnpj: true } },
      service: { select: { name: true, requiresDocument: true, estimatedMinutes: true } },
      department: { select: { name: true } },
      bankAccount: { select: { bankName: true, agency: true, accountNumber: true } },
      assignee: { select: { name: true } },
      completedBy: { select: { name: true } },
      contract: { select: { recurrenceType: true } },
      checklist: { orderBy: { order: "asc" }, include: { checkedBy: { select: { name: true } } } },
      documents: { orderBy: { createdAt: "desc" } },
      history: { orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } },
    },
  });

  if (!task) {
    notFound();
  }

  const urgency = urgencyOf(task);
  const encerrada = task.status === "CONCLUIDA" || task.status === "CANCELADA";
  const pendingRequired = task.checklist.filter((item) => item.required && !item.checkedAt).length;
  const period = periodLabel(
    task.contract?.recurrenceType ?? "MENSAL",
    task.periodStart,
    task.periodEnd
  );

  return (
    <div>
      <Link href={voltar.href} className="text-sm text-slate-500 underline hover:text-slate-900">
        {voltar.rotulo}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">{task.service.name}</h1>
        <TaskStatusBadge status={task.status} />
        {!encerrada && urgency === "VENCIDA" && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            {URGENCY_LABEL.VENCIDA}
          </span>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs font-medium text-slate-500">Cliente</dt>
          <dd className="text-slate-900">{task.company.name}</dd>
        </div>
        {task.bankAccount && (
          <div>
            <dt className="text-xs font-medium text-slate-500">Conta bancária</dt>
            <dd className="text-slate-900">
              {task.bankAccount.bankName} · ag {task.bankAccount.agency} · cc{" "}
              {task.bankAccount.accountNumber}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium text-slate-500">Período</dt>
          <dd className="text-slate-900">{period}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Prazo legal</dt>
          <dd className={urgency === "VENCIDA" ? "font-medium text-red-700" : "text-slate-900"}>
            {formatDeadline(task.dueDateLegal)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Prazo meta</dt>
          <dd className="text-slate-900">{formatDeadline(task.dueDateTarget)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Responsável</dt>
          <dd className="text-slate-900">{task.assignee?.name ?? "Sem responsável"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-slate-500">Departamento</dt>
          <dd className="text-slate-900">{task.department.name}</dd>
        </div>
        {task.completedAt && (
          <div>
            <dt className="text-xs font-medium text-slate-500">Concluída em</dt>
            <dd className="text-slate-900">
              {formatDeadline(task.completedAt)}
              {task.completedBy ? ` por ${task.completedBy.name}` : ""}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Checklist</h2>
              <span className="text-xs text-slate-500">
                {task.checklist.filter((i) => i.checkedAt).length}/{task.checklist.length}
                {pendingRequired > 0 && ` · ${pendingRequired} obrigatório(s) pendente(s)`}
              </span>
            </div>

            {task.checklist.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">
                Este serviço não tem checklist configurado.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-1">
                {task.checklist.map((item) => (
                  <li key={item.id}>
                    <form action={toggleChecklistItemAction} className="flex items-start gap-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="itemId" value={item.id} />
                      <button
                        type="submit"
                        disabled={encerrada}
                        aria-pressed={item.checkedAt !== null}
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          item.checkedAt
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-slate-300 bg-white hover:border-slate-500"
                        }`}
                      >
                        {item.checkedAt ? "✓" : ""}
                        <span className="sr-only">
                          {item.checkedAt ? "Desmarcar" : "Marcar"} {item.text}
                        </span>
                      </button>
                      <span className="flex flex-col">
                        <span
                          className={`text-sm ${
                            item.checkedAt ? "text-slate-500 line-through" : "text-slate-900"
                          }`}
                        >
                          {item.text}
                          {item.required && (
                            <span className="ml-1 text-xs text-red-600" title="Obrigatório">
                              *
                            </span>
                          )}
                        </span>
                        {item.checkedAt && item.checkedBy && (
                          <span className="text-xs text-slate-400">
                            {item.checkedBy.name} · {formatDeadline(item.checkedAt)}
                          </span>
                        )}
                      </span>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Documentos ({task.documents.length})
            </h2>
            {task.documents.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Nenhum documento anexado.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1">
                {task.documents.map((document) => (
                  <li key={document.id} className="text-sm">
                    <Link
                      href={`/api/documentos/${document.id}/arquivo`}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      {document.title}
                    </Link>
                    <span className="ml-2 text-xs text-slate-400">{document.fileName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {task.history.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-900">Histórico</h2>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {task.history.map((entry) => (
                  <li key={entry.id} className="text-slate-600">
                    <span className="text-slate-900">
                      {entry.fromStatus ? `${TASK_STATUS_LABELS[entry.fromStatus]} → ` : ""}
                      {TASK_STATUS_LABELS[entry.toStatus]}
                    </span>
                    <span className="text-slate-400">
                      {" "}
                      · {entry.author.name} · {formatDeadline(entry.createdAt)}
                    </span>
                    {entry.note && <span className="block text-xs text-slate-500">{entry.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Situação</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALLOWED_TRANSITIONS[task.status].map((next) => (
                <form key={next} action={changeTaskStatusAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="status" value={next} />
                  <button type="submit" className={buttonSecondary}>
                    {next === "EM_ANDAMENTO" && task.status === "PENDENTE"
                      ? "Iniciar"
                      : next === "EM_ANDAMENTO" && task.status === "CONCLUIDA"
                        ? "Reabrir"
                        : TASK_STATUS_LABELS[next]}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <PainelConclusao
            taskId={task.id}
            requiresDocument={task.service.requiresDocument}
            hasDocument={task.documents.length > 0}
            defaultTitle={`${task.service.name} — ${task.company.name} — ${period}`}
            disabled={encerrada}
          />
        </div>
      </div>
    </div>
  );
}
