import Link from "next/link";
import { notFound } from "next/navigation";
import { APP_TIME_ZONE, formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { describeRecurrence } from "@/lib/tasks/recurrence";
import { listAssignableUsers } from "@/lib/tasks/assignees";
import { JANELA_HISTORICO_DIAS, countEncerradas, loadCompanyTasks } from "@/lib/tasks/company-tasks";
import { buildCompanyTree } from "@/lib/tasks/tree";
import { ContractsPanel } from "@/components/services/contracts-panel";
import { AcoesEmpresa } from "@/components/tasks/acoes-empresa";
import { AlternaEncerradas } from "@/components/tasks/alterna-encerradas";
import { ArvoreTarefas } from "@/components/tasks/arvore-tarefas";
import { CompanyTabs } from "../company-tabs";

export default async function EmpresaTarefasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const incluirEncerradas = (await searchParams).concluidas === "1";
  const agora = new Date();

  const [company, services, assignees, tasks, encerradas] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: {
        bankAccounts: { orderBy: { createdAt: "asc" } },
        serviceContracts: {
          orderBy: { createdAt: "asc" },
          include: {
            service: { select: { name: true, department: { select: { name: true } } } },
            bankAccount: { select: { bankName: true, agency: true, accountNumber: true } },
            assignee: { select: { name: true } },
          },
        },
      },
    }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { department: { select: { name: true } } },
    }),
    listAssignableUsers(),
    // A rota é só do ADMIN (layout e proxy), então o recorte de papel é vazio.
    loadCompanyTasks(id, {}, agora, { incluirEncerradas }),
    countEncerradas(id, {}),
  ]);

  if (!company) {
    notFound();
  }

  const arvore = buildCompanyTree(
    tasks,
    company.serviceContracts.map((contract) => ({
      serviceId: contract.serviceId,
      bankAccountId: contract.bankAccountId,
      active: contract.active,
      recurrence: describeRecurrence(contract),
      service: contract.service,
      bankAccount: contract.bankAccount,
    }))
  );

  const abertas = arvore.reduce((sum, servico) => sum + servico.open, 0);
  const vencidas = arvore.reduce((sum, servico) => sum + servico.overdue, 0);
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(agora);

  const contas = company.bankAccounts.map((account) => ({
    id: account.id,
    rotulo: `${account.bankName} · ag ${account.agency} · cc ${account.accountNumber}`,
  }));

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Gestão de Tarefas</p>

      <CompanyTabs companyId={id} active="tarefas" />

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-slate-600" aria-live="polite">
              <strong className="font-semibold text-slate-900">{abertas}</strong> em aberto
              {vencidas > 0 && (
                <>
                  {" · "}
                  <strong className="font-semibold text-red-700">{vencidas}</strong> vencida(s)
                </>
              )}
            </p>
            <AlternaEncerradas
              ativo={incluirEncerradas}
              total={encerradas}
              href={`/admin/empresas/${id}/tarefas`}
            />
          </div>
          <AcoesEmpresa
            companyId={id}
            servicos={services.map((service) => ({
              id: service.id,
              name: service.name,
              scope: service.scope,
              departmentName: service.department.name,
            }))}
            contas={contas}
            responsaveis={assignees}
            hoje={hoje}
          />
        </div>

        <ArvoreTarefas servicos={arvore} voltar={`/admin/empresas/${id}/tarefas`} />

        <p className="text-xs text-slate-500">
          {incluirEncerradas
            ? `Mostrando também as concluídas dos últimos ${Math.round(JANELA_HISTORICO_DIAS / 30)} meses.`
            : "As concluídas saem da lista; use o link acima para revê-las ou reabrir uma."}{" "}
          A conclusão segue o checklist obrigatório de cada serviço; anexar documento é opcional.
        </p>

        <section aria-labelledby="contratos-titulo">
          <h2 id="contratos-titulo" className="text-sm font-semibold text-slate-900">
            Serviços contratados
          </h2>

          {company.bankAccounts.length === 0 && (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Esta empresa não tem conta bancária cadastrada — serviços por conta (conciliação,
              pagamentos) não poderão ser contratados.{" "}
              <Link href={`/admin/empresas/${id}/bancos`} className="underline">
                Cadastrar conta
              </Link>
              .
            </p>
          )}

          <ContractsPanel
            companyId={id}
            services={services
              .filter((service) => service.nature === "RECORRENTE")
              .map((service) => ({
                id: service.id,
                name: service.name,
                scope: service.scope,
                departmentName: service.department.name,
              }))}
            bankAccounts={company.bankAccounts.map((account) => ({
              id: account.id,
              bankName: account.bankName,
              agency: account.agency,
              accountNumber: account.accountNumber,
            }))}
            assignees={assignees}
            contracts={company.serviceContracts.map((contract) => ({
              id: contract.id,
              serviceName: contract.service.name,
              scopeLabel: contract.bankAccount
                ? `${contract.bankAccount.bankName} · ag ${contract.bankAccount.agency} · cc ${contract.bankAccount.accountNumber}`
                : null,
              recurrence: describeRecurrence(contract),
              assigneeName: contract.assignee?.name ?? null,
              targetOffsetDays: contract.targetOffsetDays,
              startsOn: formatDateOnly(contract.startsOn),
              endsOn: contract.endsOn ? formatDateOnly(contract.endsOn) : null,
              active: contract.active,
            }))}
          />
        </section>
      </div>
    </div>
  );
}
