#!/usr/bin/env node
// Consolida os dois relatórios do ERP em um JSON de métricas para o dashboard.
//
// Uso:
//   node analyze_reports.js <lucratividade.pdf> <despesas.pdf>
//
// Por que este script existe (e não uma soma direta dos dois totais):
// os relatórios têm BASES DIFERENTES e se sobrepõem parcialmente.
//   - Lucratividade: competência por viagem emitida no período; já deduz
//     frete do motorista, ICMS e pedágio para chegar na "Margem Frete".
//   - Despesas Gerais: caixa efetivamente PAGO no período, e inclui de novo
//     ICMS, pedágio, fretes e seguro de frete — além de itens que não são
//     despesa de resultado (adiantamentos, empréstimos, estornos).
// Somar "Total Despesas" + "Total Geral" contaria ICMS e pedágio duas vezes
// e trataria adiantamento de sócio como custo. Por isso classificamos item a
// item antes de consolidar.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

// Alertas são lidos por pessoas: formate em pt-BR, não em toFixed().
const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

// Classificação por código do item no ERP. É julgamento contábil explícito e
// auditável — mudou o plano de contas, mude aqui.
//
//   nao_despesa      -> movimentação patrimonial (adiantamento/empréstimo/
//                       estorno). Sai do caixa, mas não é despesa de resultado.
//   sobrepoe_frete   -> já deduzido dentro da Margem Frete da lucratividade;
//                       somar de novo seria dupla contagem.
//   demais grupos    -> despesa de resultado, aditiva à margem de frete.
const CLASSIFICACAO = {
  nao_despesa: [183, 309, 585, 580, 586, 184, 431],
  sobrepoe_frete: [41, 42, 10, 441, 104, 507],
  socios: [462],
  frota: [1, 8, 3, 213, 110, 2, 163, 93, 398, 440, 529, 383, 295, 469, 504, 74],
  comercial: [11, 263, 262],
  administrativo: [
    81, 358, 535, 272, 365, 311, 300, 247, 271, 37, 294, 197, 404, 4, 248, 298,
    460,
  ],
  pessoal: [499, 55],
  financeiro: [12, 544, 509],
  perdas: [443],
  tributos_nao_frete: [39],
};

const ROTULOS = {
  nao_despesa: "Não é despesa (adiantamentos, empréstimos, estornos)",
  sobrepoe_frete: "Já deduzido na margem de frete (ICMS, pedágio, fretes)",
  socios: "Sócios (pró-labore)",
  frota: "Frota e manutenção",
  comercial: "Comercial (descontos e comissões)",
  administrativo: "Administrativo e estrutura",
  pessoal: "Pessoal (salários e encargos)",
  financeiro: "Financeiro (juros e tarifas)",
  perdas: "Perdas operacionais",
  tributos_nao_frete: "Tributos não ligados ao frete",
};

function grupoDoCodigo(codigo) {
  for (const [grupo, codigos] of Object.entries(CLASSIFICACAO)) {
    if (codigos.includes(codigo)) return grupo;
  }
  return null;
}

function parsear(...arquivos) {
  const saida = execFileSync(
    process.execPath,
    [path.join(AQUI, "parse_pdf_reports.js"), ...arquivos],
    { maxBuffer: 1e8, encoding: "utf8" },
  );
  return JSON.parse(saida).blocos;
}

const arquivos = process.argv.slice(2);
if (arquivos.length < 2) {
  console.error("uso: node analyze_reports.js <lucratividade.pdf> <despesas.pdf>");
  process.exit(1);
}

const blocos = parsear(...arquivos);
const lucr = blocos.find((b) => b.relatorio === "lucratividade_viagens");
const desp = blocos.find((b) => b.relatorio === "despesas_gerais");

const alertas = [];
for (const b of blocos) {
  for (const aviso of b.avisos_validacao ?? []) {
    alertas.push(`[${b.arquivo_fonte}] ${aviso}`);
  }
  if (b.relatorio === "erro") alertas.push(`[${b.arquivo_fonte}] ${b.erro}`);
}
if (!lucr) alertas.push("Relatório de lucratividade não encontrado nos arquivos informados.");
if (!desp) alertas.push("Relatório de despesas gerais não encontrado nos arquivos informados.");
if (!lucr || !desp) {
  console.log(JSON.stringify({ alertas }, null, 2));
  process.exit(1);
}

// Agrupa os itens de despesa e falha se algum código não estiver classificado
// (evita que um item novo do ERP entre silenciosamente na conta errada).
const grupos = {};
const naoClassificados = [];
for (const item of desp.itens) {
  const grupo = grupoDoCodigo(item.codigo);
  if (!grupo) {
    naoClassificados.push(`${item.item} [${item.codigo}]`);
    continue;
  }
  grupos[grupo] ??= { grupo, rotulo: ROTULOS[grupo], total: 0, itens: [] };
  grupos[grupo].total += item.valor;
  grupos[grupo].itens.push(item);
}
if (naoClassificados.length > 0) {
  alertas.push(
    `Itens de despesa sem classificação (revise CLASSIFICACAO em analyze_reports.js): ${naoClassificados.join("; ")}`,
  );
}

const totalGrupo = (g) => grupos[g]?.total ?? 0;

const naoDespesa = totalGrupo("nao_despesa");
const sobrepoeFrete = totalGrupo("sobrepoe_frete");
const despesasEstrutura =
  desp.total_geral - naoDespesa - sobrepoeFrete;

// Resultado consolidado: margem de frete (competência) menos as despesas de
// estrutura efetivamente pagas, excluindo dupla contagem e não-despesas.
const resultadoConsolidado = lucr.margem_frete - despesasEstrutura;

const margemPctSobreReceita = (lucr.margem_frete / lucr.total_receitas) * 100;

if (resultadoConsolidado < 0) {
  alertas.push(
    `Resultado consolidado negativo: a margem de frete (${brl(lucr.margem_frete)}) não cobre as despesas de estrutura pagas (${brl(despesasEstrutura)}).`,
  );
}
if (naoDespesa / desp.total_geral > 0.15) {
  alertas.push(
    `${pct((naoDespesa / desp.total_geral) * 100)} do relatório de "despesas pagas" (${brl(naoDespesa)}) são adiantamentos, empréstimos e estornos — saída de caixa, não despesa de resultado.`,
  );
}
const perdas = totalGrupo("perdas");
if (perdas > 0) {
  const qtd = grupos.perdas.itens.reduce((a, i) => a + (i.quantidade ?? 0), 0);
  alertas.push(
    `Perdas operacionais de ${brl(perdas)} concentradas em apenas ${qtd} lançamento(s) — verificar documentação de suporte.`,
  );
}
if (op_margemFina(lucr)) {
  alertas.push(
    `Margem de frete de apenas ${pct((lucr.margem_frete / lucr.total_receitas) * 100)} da receita: cada 1% de erro de precificação move o resultado em ${brl(lucr.total_receitas * 0.01)}.`,
  );
}

function op_margemFina(l) {
  return l.margem_frete / l.total_receitas < 0.15;
}

const metricas = {
  gerado_em: new Date().toISOString(),
  empresa: lucr.empresa,
  periodo: lucr.periodo,
  arquivos_fonte: blocos.map((b) => b.arquivo_fonte),

  operacao_frete: {
    total_viagens: lucr.total_viagens,
    clientes_atendidos: lucr.total_clientes,
    rotas: lucr.total_rotas_detalhadas,
    receitas: lucr.receitas,
    total_receitas: lucr.total_receitas,
    custos: lucr.despesas,
    total_custos: lucr.total_despesas,
    margem_frete: lucr.margem_frete,
    margem_pct_sobre_receita: Number(margemPctSobreReceita.toFixed(2)),
    receita_media_por_viagem: Number(
      (lucr.total_receitas / lucr.total_viagens).toFixed(2),
    ),
    margem_media_por_viagem: Number(
      (lucr.margem_frete / lucr.total_viagens).toFixed(2),
    ),
  },

  despesas_pagas: {
    total_relatorio: desp.total_geral,
    quantidade_itens: desp.quantidade_itens,
    nao_despesa: naoDespesa,
    sobrepoe_frete: sobrepoeFrete,
    despesas_estrutura: Number(despesasEstrutura.toFixed(2)),
    grupos: Object.values(grupos)
      .map((g) => ({
        ...g,
        total: Number(g.total.toFixed(2)),
        pct_do_relatorio: Number(((g.total / desp.total_geral) * 100).toFixed(2)),
        itens: g.itens.map((i) => ({ item: i.item, codigo: i.codigo, valor: i.valor })),
      }))
      .sort((a, b) => b.total - a.total),
  },

  consolidado: {
    margem_frete: lucr.margem_frete,
    despesas_estrutura: Number(despesasEstrutura.toFixed(2)),
    resultado: Number(resultadoConsolidado.toFixed(2)),
    margem_liquida_pct: Number(
      ((resultadoConsolidado / lucr.total_receitas) * 100).toFixed(2),
    ),
  },

  alertas,
};

console.log(JSON.stringify(metricas, null, 2));
