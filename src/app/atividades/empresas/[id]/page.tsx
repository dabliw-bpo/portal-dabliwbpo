import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isInternalRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { JANELA_HISTORICO_DIAS, loadCompanyTasks } from "@/lib/tasks/company-tasks";
import { taskScopeFor } from "@/lib/tasks/scope";
import { buildCompanyTree } from "@/lib/tasks/tree";
import { ArvoreTarefas } from "@/components/tasks/arvore-tarefas";

/**
 * A Gestão de Tarefas de uma empresa para a equipe da Matriz. É a mesma árvore
 * da aba do admin, só que cortada por `taskScopeFor` e sem o que mexe em
 * contrato (contratar, gerar, abrir demanda avulsa), que segue exclusivo do
 * admin.
 */
export default async function EmpresaDaOperacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (session?.user && !isInternalRole(session.user.role)) {
    redirect("/atividades");
  }
  const scope = await taskScopeFor(session);

  const company = await prisma.company.findFirst({
    where: { id, isHeadquarters: false },
    select: { id: true, name: true },
  });
  if (!company) {
    notFound();
  }

  const tasks = await loadCompanyTasks(id, scope);
  // Sem contratos de propósito: um serviço sem demanda visível para este papel
  // não deve aparecer na árvore, senão ela revelaria o que o recorte esconde.
  const arvore = buildCompanyTree(tasks, []);

  const abertas = arvore.reduce((sum, servico) => sum + servico.open, 0);
  const vencidas = arvore.reduce((sum, servico) => sum + servico.overdue, 0);

  return (
    <div>
      <Link
        href="/atividades/empresas"
        className="text-sm text-slate-500 underline hover:text-slate-900"
      >
        ← Empresas
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">{company.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Gestão de Tarefas</p>

      <p className="mt-6 text-sm text-slate-600" aria-live="polite">
        <strong className="font-semibold text-slate-900">{abertas}</strong> em aberto
        {vencidas > 0 && (
          <>
            {" · "}
            <strong className="font-semibold text-red-700">{vencidas}</strong> vencida(s)
          </>
        )}
      </p>

      <div className="mt-4">
        <ArvoreTarefas
          servicos={arvore}
          voltar={`/atividades/empresas/${id}`}
          vazio="Nenhuma demanda desta empresa dentro do que o seu papel e os seus departamentos permitem ver."
        />
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Mostrando os últimos {Math.round(JANELA_HISTORICO_DIAS / 30)} meses e tudo que está em
        aberto.
      </p>
    </div>
  );
}
