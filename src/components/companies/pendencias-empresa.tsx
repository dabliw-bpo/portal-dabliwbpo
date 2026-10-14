import Link from "next/link";
import {
  documentTabHref,
  type CompanyAlerts,
  type PendingDocument,
} from "@/lib/company-alerts";
import { formatDateOnly } from "@/lib/format";

export type FiltroPendencias = "assinatura" | "ferias" | "recibos" | null;

export function parseFiltroPendencias(value: string | string[] | undefined): FiltroPendencias {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "assinatura" || first === "ferias" || first === "recibos" ? first : null;
}

const ABA_DO_DOCUMENTO = (doc: PendingDocument): string => {
  if (doc.receiptId) return "Recibos";
  switch (doc.type) {
    case "PAYSLIP":
      return "Holerites";
    case "VACATION_REQUEST":
      return "Férias";
    default:
      return "Outros documentos";
  }
};

type Item = { chave: string; texto: string; acao: string; href: string };

/**
 * As pendências da empresa, por pessoa, no topo da aba Folha. É o destino dos
 * atalhos do painel: cada item leva direto à aba do colaborador onde aquilo é
 * resolvido, em vez de deixar o admin procurar quem está devendo o quê.
 */
export function PendenciasEmpresa({
  alerts,
  filtro,
}: {
  alerts: CompanyAlerts;
  filtro: FiltroPendencias;
}) {
  const base = `/admin/empresas/${alerts.companyId}/folha`;
  const porPessoa = new Map<string, { nome: string; itens: Item[] }>();
  const pessoa = (id: string, nome: string) => {
    let entrada = porPessoa.get(id);
    if (!entrada) {
      entrada = { nome, itens: [] };
      porPessoa.set(id, entrada);
    }
    return entrada;
  };

  if (filtro === null || filtro === "assinatura") {
    for (const doc of alerts.documents) {
      pessoa(doc.userId, doc.userName).itens.push({
        chave: `d-${doc.id}`,
        texto: `${doc.title} — aguardando assinatura desde ${doc.createdAt.toLocaleDateString("pt-BR")}`,
        acao: `Abrir em ${ABA_DO_DOCUMENTO(doc)}`,
        href: documentTabHref(base, doc),
      });
    }
  }
  if (filtro === null || filtro === "ferias") {
    for (const request of alerts.vacations) {
      pessoa(request.userId, request.userName).itens.push({
        chave: `f-${request.id}`,
        texto: `Férias a partir de ${formatDateOnly(request.startDate)} — aguardando revisão`,
        acao: "Revisar pedido",
        href: `/admin/ferias/${request.id}?returnTo=${encodeURIComponent(`/admin/empresas/${alerts.companyId}`)}`,
      });
    }
  }
  if (filtro === null || filtro === "recibos") {
    for (const receipt of alerts.draftReceipts) {
      pessoa(receipt.userId, receipt.userName).itens.push({
        chave: `r-${receipt.id}`,
        texto: `${receipt.description} — recibo ainda não enviado para assinatura`,
        acao: "Abrir em Recibos",
        href: `${base}/${receipt.userId}/recibos/${receipt.id}`,
      });
    }
  }

  const pessoas = [...porPessoa.entries()].sort(([, a], [, b]) => a.nome.localeCompare(b.nome, "pt-BR"));
  const opcoes: Array<{ valor: FiltroPendencias; rotulo: string; total: number }> = [
    {
      valor: null,
      rotulo: "Todas",
      total: alerts.documents.length + alerts.vacations.length + alerts.draftReceipts.length,
    },
    { valor: "assinatura", rotulo: "Assinaturas", total: alerts.documents.length },
    { valor: "ferias", rotulo: "Férias", total: alerts.vacations.length },
    { valor: "recibos", rotulo: "Recibos", total: alerts.draftReceipts.length },
  ];

  if (opcoes[0].total === 0) {
    return null;
  }

  return (
    <section
      id="pendencias"
      aria-labelledby="pendencias-titulo"
      className="mt-6 scroll-mt-4 overflow-hidden rounded-lg border border-amber-300 bg-white"
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3">
        <h2 id="pendencias-titulo" className="text-sm font-semibold text-slate-900">
          Pendências desta empresa
        </h2>
        <nav aria-label="Filtrar pendências" className="ml-auto flex flex-wrap gap-2 text-xs">
          {opcoes
            .filter((opcao) => opcao.valor === null || opcao.total > 0)
            .map((opcao) => {
              const ativo = opcao.valor === filtro;
              const href = opcao.valor
                ? `/admin/empresas/${alerts.companyId}?filtro=${opcao.valor}#pendencias`
                : `/admin/empresas/${alerts.companyId}#pendencias`;
              return (
                <Link
                  key={opcao.rotulo}
                  href={href}
                  aria-current={ativo ? "true" : undefined}
                  className={`rounded-full px-2.5 py-1 font-medium tabular-nums ${
                    ativo
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opcao.rotulo} · {opcao.total}
                </Link>
              );
            })}
        </nav>
      </header>

      {pessoas.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">Nada pendente neste filtro.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pessoas.map(([id, entrada]) => (
            <li key={id} className="px-4 py-3">
              <p className="text-sm font-medium text-slate-900">{entrada.nome}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {entrada.itens.map((item) => (
                  <li key={item.chave} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="text-slate-600">{item.texto}</span>
                    <Link
                      href={item.href}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      {item.acao}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
