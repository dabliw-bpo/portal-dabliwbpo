import Link from "next/link";
import { alertWeight, type CompanyAlerts } from "@/lib/company-alerts";

type Linha = {
  chave: string;
  texto: string;
  detalhe?: string;
  href: string;
  /** `urgente` é o que já passou do prazo; `atencao` espera alguém. */
  tom: "urgente" | "atencao";
};

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

function nomesResumidos(nomes: string[]): string {
  const unicos = [...new Set(nomes)];
  const primeiros = unicos.slice(0, 3).join(", ");
  return unicos.length > 3 ? `${primeiros} e mais ${unicos.length - 3}` : primeiros;
}

/**
 * As notificações de uma empresa como linhas, cada uma com o link da aba onde
 * aquilo se resolve — é isto que torna o painel um atalho e não só um aviso.
 */
function linhasDa(empresa: CompanyAlerts): Linha[] {
  const base = `/admin/empresas/${empresa.companyId}`;
  const linhas: Linha[] = [];

  if (empresa.overdueTasks > 0) {
    linhas.push({
      chave: "vencidas",
      texto: plural(empresa.overdueTasks, "tarefa atrasada", "tarefas atrasadas"),
      detalhe: "Gestão de Tarefas",
      href: `${base}/tarefas?filtro=vencidas`,
      tom: "urgente",
    });
  }
  if (empresa.documents.length > 0) {
    const pessoas = new Set(empresa.documents.map((doc) => doc.userId)).size;
    linhas.push({
      chave: "assinatura",
      texto: `${plural(empresa.documents.length, "documento aguardando assinatura", "documentos aguardando assinatura")}`,
      detalhe: `${plural(pessoas, "colaborador", "colaboradores")}: ${nomesResumidos(
        empresa.documents.map((doc) => doc.userName)
      )}`,
      href: `${base}?filtro=assinatura#pendencias`,
      tom: "atencao",
    });
  }
  if (empresa.vacations.length > 0) {
    const unico = empresa.vacations.length === 1 ? empresa.vacations[0] : null;
    linhas.push({
      chave: "ferias",
      texto: plural(empresa.vacations.length, "pedido de férias para revisar", "pedidos de férias para revisar"),
      detalhe: nomesResumidos(empresa.vacations.map((request) => request.userName)),
      href: unico
        ? `/admin/ferias/${unico.id}?returnTo=${encodeURIComponent("/admin")}`
        : `${base}?filtro=ferias#pendencias`,
      tom: "atencao",
    });
  }
  if (empresa.draftReceipts.length > 0) {
    linhas.push({
      chave: "recibos",
      texto: plural(
        empresa.draftReceipts.length,
        "recibo ainda não enviado",
        "recibos ainda não enviados"
      ),
      detalhe: nomesResumidos(empresa.draftReceipts.map((receipt) => receipt.userName)),
      href: `${base}?filtro=recibos#pendencias`,
      tom: "atencao",
    });
  }
  if (empresa.dueTodayTasks > 0) {
    linhas.push({
      chave: "hoje",
      texto: plural(empresa.dueTodayTasks, "tarefa vence hoje", "tarefas vencem hoje"),
      detalhe: "Gestão de Tarefas",
      href: `${base}/tarefas?filtro=hoje`,
      tom: "atencao",
    });
  }

  return linhas;
}

/**
 * Um cartão por empresa com o que está esperando ação. Empresas sem nada
 * pendente não ganham cartão: ficam numa linha só, "em dia", para o painel
 * mostrar onde agir e não repetir a lista de clientes.
 */
export function PainelEmpresas({ empresas }: { empresas: CompanyAlerts[] }) {
  const comPendencia = empresas
    .filter((empresa) => alertWeight(empresa) > 0)
    .sort(
      (a, b) =>
        Number(b.overdueTasks > 0) - Number(a.overdueTasks > 0) || alertWeight(b) - alertWeight(a)
    );
  const emDia = empresas.filter((empresa) => alertWeight(empresa) === 0);

  return (
    <div className="flex flex-col gap-4">
      {comPendencia.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nenhuma empresa com pendência. Tudo em dia.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {comPendencia.map((empresa) => {
            const linhas = linhasDa(empresa);
            const urgente = empresa.overdueTasks > 0;
            return (
              <li
                key={empresa.companyId}
                className={`overflow-hidden rounded-lg border bg-white ${
                  urgente ? "border-red-300" : "border-amber-300"
                }`}
              >
                <header
                  className={`flex items-center gap-2 border-b px-4 py-3 ${
                    urgente ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
                    <Link
                      href={`/admin/empresas/${empresa.companyId}`}
                      className="hover:underline"
                    >
                      {empresa.name}
                    </Link>
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                      urgente ? "bg-red-200 text-red-900" : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {linhas.length === 1 ? "1 aviso" : `${linhas.length} avisos`}
                  </span>
                </header>
                <ul className="divide-y divide-slate-100">
                  {linhas.map((linha) => (
                    <li key={linha.chave}>
                      <Link
                        href={linha.href}
                        className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <span
                          aria-hidden
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            linha.tom === "urgente" ? "bg-red-500" : "bg-amber-500"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-sm font-medium ${
                              linha.tom === "urgente" ? "text-red-800" : "text-slate-900"
                            }`}
                          >
                            {linha.texto}
                          </span>
                          {linha.detalhe && (
                            <span className="block truncate text-xs text-slate-500">
                              {linha.detalhe}
                            </span>
                          )}
                        </span>
                        <span
                          aria-hidden
                          className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
                        >
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      {emDia.length > 0 && (
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">Em dia:</span>{" "}
          {emDia.map((empresa, index) => (
            <span key={empresa.companyId}>
              {index > 0 && ", "}
              <Link
                href={`/admin/empresas/${empresa.companyId}`}
                className="underline hover:text-slate-900"
              >
                {empresa.name}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}
