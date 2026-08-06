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

import { parsearRelatorios } from "./parse_pdf_reports.js";

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
  // Decisão do cliente (ago/2026): o desconto concedido sai do total de
  // despesas. Ele é redutor de receita, não custo de estrutura, e a receita
  // de frete do relatório de lucratividade já vem líquida — mantê-lo aqui
  // contaria a mesma concessão duas vezes.
  excluido_decisao: [11],
  // 559 (título de capitalização) é compra de aplicação, não despesa.
  nao_despesa: [183, 309, 585, 580, 586, 184, 431, 559],
  // 342 (fretes acertos devolução) é acerto de frete, mesma natureza do 104.
  sobrepoe_frete: [41, 42, 10, 441, 104, 507, 342],
  socios: [462],
  // 59 = licenciamento veicular, mesma natureza do 295 (documentação de veículos).
  // 389 = limpeza de caminhões, mesma natureza do 383 (lavagem de veículo).
  frota: [
    1, 8, 3, 213, 110, 2, 163, 93, 398, 440, 529, 383, 295, 469, 504, 74, 59,
    389,
  ],
  // 261 = comissão (genérica), junto das comissões 262/263.
  comercial: [263, 262, 261],
  // 536 acompanha 535 (sistema); 488 acompanha 197 (alimentação); 566 uniformes
  // e 291 supermercado são custo de estrutura.
  // 477 (recuperação de despesas) fica em administrativo por decisão do
  // cliente (ago/2026).
  administrativo: [
    81, 358, 535, 272, 365, 311, 300, 247, 271, 37, 294, 197, 404, 4, 248, 298,
    460, 536, 488, 566, 291, 477,
  ],
  pessoal: [499, 55],
  // 548 = tarifa de TED, mesma natureza do 544 (tarifa de cobrança).
  financeiro: [12, 544, 509, 548],
  perdas: [443],
  tributos_nao_frete: [39],
};

// Classificações que merecem confirmação do contador antes de virar rotina.
// Vazio hoje: a única pendência (477) foi decidida pelo cliente em ago/2026.
const AJUSTES_A_CONFIRMAR = {};

const ROTULOS = {
  excluido_decisao: "Excluído por decisão (desconto concedido)",
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

const arquivos = process.argv.slice(2);
if (arquivos.length < 2) {
  console.error("uso: node analyze_reports.js <lucratividade.pdf> <despesas.pdf>");
  process.exit(1);
}

const blocos = await parsearRelatorios(arquivos);
const lucr = blocos.find((b) => b.relatorio === "lucratividade_viagens");
const desp = blocos.find((b) => b.relatorio === "despesas_gerais");
// Opcional: relatório de receitas gerais. Quando presente, entra no resultado
// já sem o grupo RECEITA OPERACIONAL (que é o frete, já contado na
// lucratividade) — ver GRUPOS_RECEITA_EXCLUIDOS em parse_pdf_reports.js.
const rec = blocos.find((b) => b.relatorio === "receitas_gerais");

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
const excluidoDecisao = totalGrupo("excluido_decisao");
const despesasEstrutura =
  desp.total_geral - naoDespesa - sobrepoeFrete - excluidoDecisao;

// Receitas não-frete do período (0 quando o relatório não foi informado).
const outrasReceitas = rec?.outras_receitas ?? 0;

// Resultado consolidado: margem de frete (competência) mais as outras
// receitas, menos as despesas de estrutura efetivamente pagas, excluindo
// dupla contagem e não-despesas.
const resultadoConsolidado =
  lucr.margem_frete + outrasReceitas - despesasEstrutura;

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
// A exclusão do desconto concedido é a decisão de maior impacto do relatório
// (em jul/2026 ela sozinha vira prejuízo em lucro). Nunca deixe implícita.
if (excluidoDecisao > 0) {
  alertas.push(
    `Desconto concedido de ${brl(excluidoDecisao)} foi EXCLUÍDO do total de despesas por decisão. Isso pressupõe que a receita de frete já vem líquida desse desconto; se não vier, o resultado está superavaliado nesse valor.`,
  );
}

// Um único item dominando o período costuma ser evento pontual, não rotina —
// vale destacar em vez de deixar diluído no grupo.
for (const item of desp.itens) {
  if (item.valor / desp.total_geral > 0.25) {
    alertas.push(
      `Concentração: "${item.item}" sozinho é ${pct((item.valor / desp.total_geral) * 100)} de tudo que foi pago no período (${brl(item.valor)}).`,
    );
  }
}

for (const item of desp.itens) {
  const nota = AJUSTES_A_CONFIRMAR[item.codigo];
  if (nota) alertas.push(`A confirmar com a contabilidade: ${nota}`);
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
    // Cortes vindos das linhas de viagem (validados contra os totais do ERP
    // em parse_pdf_reports.js). Alimentam a série mensal e a curva ABC.
    por_mes: lucr.por_mes,
    por_cliente: lucr.por_cliente,
    por_mes_cliente: lucr.por_mes_cliente,
  },

  despesas_pagas: {
    total_relatorio: desp.total_geral,
    quantidade_itens: desp.quantidade_itens,
    nao_despesa: naoDespesa,
    sobrepoe_frete: sobrepoeFrete,
    excluido_decisao: excluidoDecisao,
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

  outras_receitas: rec
    ? {
        total: outrasReceitas,
        excluido_receita_operacional: rec.total_excluido,
        excluido_itens: rec.total_itens_excluidos ?? 0,
        itens_excluidos: rec.itens_excluidos ?? [],
        total_relatorio: rec.total_geral,
        grupos: rec.grupos,
      }
    : null,

  consolidado: {
    margem_frete: lucr.margem_frete,
    outras_receitas: outrasReceitas,
    despesas_estrutura: Number(despesasEstrutura.toFixed(2)),
    resultado: Number(resultadoConsolidado.toFixed(2)),
    margem_liquida_pct: Number(
      ((resultadoConsolidado / lucr.total_receitas) * 100).toFixed(2),
    ),
  },

  alertas,
};

console.log(JSON.stringify(metricas, null, 2));
