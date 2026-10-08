import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isInternalRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { taskScopeFor } from "@/lib/tasks/scope";
import { OPEN_STATUSES } from "@/lib/tasks/urgency";

/**
 * Empresas atendidas pela equipe da Matriz. A lista é de todas as empresas
 * clientes; o que muda por papel são os números, que saem do recorte de
 * `taskScopeFor` — um operador só conta o que pode de fato abrir.
 */
export default async function EmpresasDaOperacaoPage() {
  const session = await auth();
  // O colaborador só executa o que lhe foi atribuído; não navega pelas empresas.
  if (session?.user && !isInternalRole(session.user.role)) {
    redirect("/atividades");
  }
  const scope = await taskScopeFor(session);
  const agora = new Date();

  const [companies, abertas, vencidas] = await Promise.all([
    prisma.company.findMany({
      where: { isHeadquarters: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, tradeName: true },
    }),
    prisma.task.groupBy({
      by: ["companyId"],
      where: { AND: [scope, { status: { in: [...OPEN_STATUSES] } }] },
      _count: { _all: true },
    }),
    prisma.task.groupBy({
      by: ["companyId"],
      where: {
        AND: [scope, { status: { in: [...OPEN_STATUSES] } }, { dueDateLegal: { lt: agora } }],
      },
      _count: { _all: true },
    }),
  ]);

  const emAberto = new Map(abertas.map((row) => [row.companyId, row._count._all]));
  const emAtraso = new Map(vencidas.map((row) => [row.companyId, row._count._all]));

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Empresas</h1>
      <p className="mt-1 text-sm text-slate-500">
        As demandas de cada cliente, por serviço, conta e mês. Você vê o que o seu papel e os seus
        departamentos permitem.
      </p>

      <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {companies.map((company) => {
          const total = emAberto.get(company.id) ?? 0;
          const atrasadas = emAtraso.get(company.id) ?? 0;
          return (
            <li key={company.id}>
              <Link
                href={`/atividades/empresas/${company.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="text-slate-900">{company.name}</span>
                <span className="text-xs text-slate-500">
                  {total === 0 ? "sem demandas em aberto" : `${total} em aberto`}
                  {atrasadas > 0 && (
                    <span className="ml-2 font-medium text-red-700">{atrasadas} vencida(s)</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
        {companies.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-slate-600">
            Nenhuma empresa cliente cadastrada.
          </li>
        )}
      </ul>
    </div>
  );
}
