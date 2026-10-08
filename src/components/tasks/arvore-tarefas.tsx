import { monthStartsOpen, type ServiceNode, type TreeTask } from "@/lib/tasks/tree";
import { LinhaDemanda, type LinhaDemandaDados } from "./linha-demanda";

function paraLinha(task: TreeTask): LinhaDemandaDados {
  return {
    id: task.id,
    status: task.status,
    origin: task.origin,
    vencida: task.urgency === "VENCIDA",
    hoje: task.urgency === "HOJE",
    dia: task.dayLabel,
    diaSemana: task.weekdayLabel,
    prazo: task.deadlineLabel,
    responsavel: task.assigneeName,
    itens: task.checklist.map((item) => ({
      id: item.id,
      texto: item.text,
      obrigatorio: item.required,
      marcado: item.checked,
    })),
    documentos: task.documentCount,
    exigeDocumento: task.requiresDocument,
  };
}

function Contagem({ open, overdue }: { open: number; overdue: number }) {
  return (
    <span className="text-xs font-normal text-slate-500">
      {open === 0 ? "tudo em dia" : `${open} em aberto`}
      {overdue > 0 && <span className="ml-1.5 font-medium text-red-700">· {overdue} vencida(s)</span>}
    </span>
  );
}

/**
 * Serviço → conta bancária → mês → datas. Cada nível é um recuo com filete à
 * esquerda, como a árvore da planilha que a equipe já usa; os meses são
 * `<details>` nativos, então abrir e fechar não custa JavaScript.
 */
export function ArvoreTarefas({
  servicos,
  voltar,
  vazio = "Esta empresa ainda não tem serviço contratado nem demanda aberta. Contrate um serviço ou abra uma demanda avulsa.",
}: {
  servicos: ServiceNode[];
  /** Caminho para a tela de atividade devolver o usuário a esta aba. */
  voltar: string;
  /** Texto de quando não há nada a mostrar; muda conforme quem está olhando. */
  vazio?: string;
}) {
  if (servicos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-600">
        {vazio}
      </p>
    );
  }

  const now = new Date();

  return (
    <ul className="flex flex-col gap-4">
      {servicos.map((servico) => (
        <li key={servico.key} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-slate-900">{servico.name}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {servico.departmentName}
            </span>
            {servico.contractActive === false && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
                Contrato inativo
              </span>
            )}
            <Contagem open={servico.open} overdue={servico.overdue} />
          </div>
          {servico.recurrence && <p className="mt-0.5 text-xs text-slate-500">{servico.recurrence}</p>}

          <div className="mt-3 flex flex-col gap-3">
            {servico.accounts.map((conta) => (
              <div
                key={conta.key}
                className={conta.label ? "border-l-2 border-slate-200 pl-4" : undefined}
              >
                {conta.label && (
                  <p className="text-sm font-medium text-slate-800">{conta.label}</p>
                )}

                {conta.months.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    Nenhuma demanda aberta ainda — elas surgem conforme a data se aproxima.
                  </p>
                )}

                <div className="mt-1 flex flex-col gap-1">
                  {conta.months.map((mes) => (
                    <details
                      key={mes.key}
                      open={monthStartsOpen(mes, now)}
                      className="group border-l-2 border-slate-100 pl-4"
                    >
                      <summary className="flex cursor-pointer list-none items-baseline gap-3 py-1 text-sm text-slate-700 marker:hidden hover:text-slate-900">
                        <span
                          aria-hidden
                          className="text-xs text-slate-400 transition-transform group-open:rotate-90"
                        >
                          ▸
                        </span>
                        <span className="font-medium">{mes.label}</span>
                        <span className="text-xs text-slate-500">
                          {mes.done}/{mes.tasks.length} concluída(s)
                        </span>
                        {mes.overdue > 0 && (
                          <span className="text-xs font-medium text-red-700">
                            {mes.overdue} vencida(s)
                          </span>
                        )}
                      </summary>
                      <ul className="ml-5 divide-y divide-slate-100">
                        {mes.tasks.map((task) => (
                          <LinhaDemanda key={task.id} dados={paraLinha(task)} voltar={voltar} />
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
