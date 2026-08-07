#!/usr/bin/env node
// Gera a planilha Excel de auditoria: uma aba por mês (jan a dez/2026) mais
// um Dashboard que lê os meses por fórmula. Sem Python/LibreOffice nesta
// máquina — ver scripts/verify_workbook.js para como isso é verificado.
//
// Uso:
//   node build_workbook.js [saida.xlsx]
//
// PRINCÍPIO: dentro de cada mês, os totais por grupo são fórmulas SOMASE
// sobre uma tabela de itens editável — se você corrigir um valor ou a
// classificação de um item, o resto da aba recalcula sozinho. O que NÃO dá
// para tornar fórmula é a leitura dos PDFs em si (parsing de 1.500+ viagens
// e classificação de item): isso continua exigindo rodar o pipeline Node
// (analyze_reports.js) e colar o resultado na aba do mês.

import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "..");

// ---------------------------------------------------------------------------
// Layout — MESMA linha em TODAS as 12 abas de mês. O Dashboard depende disso.
// ---------------------------------------------------------------------------
const L = {
  TITULO: 1,
  SUBTITULO: 2,
  OP_HEADER: 4,
  VIAGENS: 5,
  CLIENTES: 6,
  RECEITA: 7,
  MARGEM: 8,
  MARGEM_PCT: 9,

  DESP_HEADER: 11,
  DESP_COLHEAD: 12,
  DESP_ITEM_START: 13,
  N_DESP_ITENS: 80,
  get DESP_ITEM_END() { return this.DESP_ITEM_START + this.N_DESP_ITENS - 1; }, // 92

  RESUMO_DESP_HEADER: 94,
  G_FROTA: 95,
  G_ADMINISTRATIVO: 96,
  G_SOCIOS: 97,
  G_COMERCIAL: 98,
  G_FINANCEIRO: 99,
  G_PESSOAL: 100,
  G_PERDAS: 101,
  G_TRIBUTOS: 102,
  ESTRUTURA: 103,
  G_EXCLUIDO_DECISAO: 104,
  G_SOBREPOE_FRETE: 105,
  G_NAO_DESPESA: 106,
  TOTAL_CALC: 107,
  TOTAL_IMPRESSO: 108,
  DIFERENCA: 109,

  REC_HEADER: 111,
  REC_COLHEAD: 112,
  REC_GRUPO_START: 113,
  N_REC_GRUPOS: 20,
  get REC_GRUPO_END() { return this.REC_GRUPO_START + this.N_REC_GRUPOS - 1; }, // 132

  REC_EXCL_HEADER: 134,
  REC_EXCL_COLHEAD: 135,
  REC_EXCL_START: 136,
  N_REC_EXCL: 20,
  get REC_EXCL_END() { return this.REC_EXCL_START + this.N_REC_EXCL - 1; }, // 155

  RESUMO_REC_HEADER: 157,
  REC_BRUTA: 158,
  REC_EXCL_TOTAL: 159,
  REC_LIQUIDA: 160,

  RESULTADO_HEADER: 162,
  RES_MARGEM: 163,
  RES_OUTRAS: 164,
  RES_DESPESAS: 165,
  RESULTADO: 166,
  MARGEM_LIQ_PCT: 167,
};

const GRUPOS_REAIS = [
  ["frota", "Frota e manutenção", "G_FROTA"],
  ["administrativo", "Administrativo e estrutura", "G_ADMINISTRATIVO"],
  ["socios", "Sócios (pró-labore)", "G_SOCIOS"],
  ["comercial", "Comercial (descontos e comissões)", "G_COMERCIAL"],
  ["financeiro", "Financeiro (juros e tarifas)", "G_FINANCEIRO"],
  ["pessoal", "Pessoal (salários e encargos)", "G_PESSOAL"],
  ["perdas", "Perdas operacionais", "G_PERDAS"],
  ["tributos_nao_frete", "Tributos não ligados ao frete", "G_TRIBUTOS"],
];
const GRUPOS_EXCLUIDOS = [
  ["excluido_decisao", "Excluído por decisão (desconto concedido)", "G_EXCLUIDO_DECISAO"],
  ["sobrepoe_frete", "Já deduzido na margem de frete", "G_SOBREPOE_FRETE"],
  ["nao_despesa", "Não é despesa (adiantamentos, empréstimos, estornos)", "G_NAO_DESPESA"],
];

const MESES = [
  ["JAN", 1, "Janeiro"], ["FEV", 2, "Fevereiro"], ["MAR", 3, "Março"],
  ["ABR", 4, "Abril"], ["MAI", 5, "Maio"], ["JUN", 6, "Junho"],
  ["JUL", 7, "Julho"], ["AGO", 8, "Agosto"], ["SET", 9, "Setembro"],
  ["OUT", 10, "Outubro"], ["NOV", 11, "Novembro"], ["DEZ", 12, "Dezembro"],
];

// --- Estilos (convenção: azul = input, preto = fórmula, ver LEIA-ME) -------
const FONTE = "Arial";
const AZUL = { argb: "FF0000FF" };
const PRETO = { argb: "FF000000" };
const CINZA_HEADER = { argb: "FFE9E9ED" };
const AMARELO = { argb: "FFFFFF00" };
const MOEDA = '"R$" #,##0.00;[RED]-"R$" #,##0.00';
const PCT = "0.0%";

function estiloBase(cell) {
  cell.font = { name: FONTE, size: 10 };
}
function input(cell, valor, formato) {
  estiloBase(cell);
  cell.value = valor;
  cell.font = { name: FONTE, size: 10, color: AZUL };
  if (formato) cell.numFmt = formato;
}
function formula(cell, f, formato) {
  estiloBase(cell);
  cell.value = { formula: f };
  cell.font = { name: FONTE, size: 10, color: PRETO };
  if (formato) cell.numFmt = formato;
}
function tituloSecao(cell, texto) {
  estiloBase(cell);
  cell.value = texto;
  cell.font = { name: FONTE, size: 10, bold: true };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: CINZA_HEADER };
}
function cabecalhoColuna(cell, texto) {
  estiloBase(cell);
  cell.value = texto;
  cell.font = { name: FONTE, size: 9, bold: true, italic: true };
}

// ---------------------------------------------------------------------------
function construirAbaMes(wb, sigla, numero, nomeCompleto, dados) {
  const ws = wb.addWorksheet(sigla);
  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 16;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 14;
  ws.getColumn(5).width = 60;

  const empresa = dados?.empresa ?? "EGM TRANSPORTES E LOGISTICA LTDA";
  ws.getCell(`A${L.TITULO}`).value = empresa;
  ws.getCell(`A${L.TITULO}`).font = { name: FONTE, size: 12, bold: true };
  ws.getCell(`A${L.SUBTITULO}`).value = `Auditoria de Demonstrativos — ${nomeCompleto}/2026`;
  ws.getCell(`A${L.SUBTITULO}`).font = { name: FONTE, size: 10, italic: true };

  // --- Operação de frete ---
  tituloSecao(ws.getCell(`A${L.OP_HEADER}`), "OPERAÇÃO DE FRETE");
  tituloSecao(ws.getCell(`B${L.OP_HEADER}`), "");
  const op = dados?.operacao_frete;
  ws.getCell(`A${L.VIAGENS}`).value = "Viagens no período";
  input(ws.getCell(`B${L.VIAGENS}`), op?.total_viagens ?? 0, "#,##0");
  ws.getCell(`A${L.CLIENTES}`).value = "Clientes atendidos";
  input(ws.getCell(`B${L.CLIENTES}`), op?.clientes_atendidos ?? 0, "#,##0");
  // Base = soma do campo "Frete Empresa" viagem a viagem (mesma base do
  // Dashboard HTML e de tudo que já foi reportado até aqui). NÃO é o "Total
  // Receitas" que o ERP imprime no rodapé — aquele soma mais dois
  // componentes (pedágio não embutido, outros descontos do motorista) que
  // não existem por viagem, só no total do período. As duas bases diferem
  // ~0,5 a 6% dependendo do mês; ver nota E7 e METODOLOGIA.
  ws.getCell(`A${L.RECEITA}`).value = "Receita de frete (soma do Frete Empresa por viagem)";
  input(ws.getCell(`B${L.RECEITA}`), op?.por_mes?.[0]?.frete_empresa ?? 0, MOEDA);
  ws.getCell(`E${L.RECEITA}`).value = dados
    ? `Total Receitas impresso no relatório (inclui pedágio/outros): ${(op?.total_receitas ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} — ver METODOLOGIA`
    : "";
  ws.getCell(`E${L.RECEITA}`).font = { name: FONTE, size: 9, italic: true, color: { argb: "FF808080" } };
  ws.getCell(`A${L.MARGEM}`).value = "Margem de frete (Margem Frete impressa)";
  input(ws.getCell(`B${L.MARGEM}`), op?.margem_frete ?? 0, MOEDA);
  ws.getCell(`A${L.MARGEM_PCT}`).value = "Margem % sobre a receita";
  formula(ws.getCell(`B${L.MARGEM_PCT}`), `=IFERROR(B${L.MARGEM}/B${L.RECEITA},0)`, PCT);

  // --- Despesas: tabela de itens (editável) ---
  tituloSecao(ws.getCell(`A${L.DESP_HEADER}`), "DESPESAS PAGAS — DETALHE POR ITEM (editável)");
  ws.mergeCells(`A${L.DESP_HEADER}:C${L.DESP_HEADER}`);
  cabecalhoColuna(ws.getCell(`A${L.DESP_COLHEAD}`), "Item");
  cabecalhoColuna(ws.getCell(`B${L.DESP_COLHEAD}`), "Valor (R$)");
  cabecalhoColuna(ws.getCell(`C${L.DESP_COLHEAD}`), "Grupo (código)");

  const itensDesp = [];
  for (const g of dados?.despesas_pagas?.grupos ?? []) {
    for (const it of g.itens) itensDesp.push({ item: it.item, valor: it.valor, grupo: g.grupo });
  }
  for (let i = 0; i < L.N_DESP_ITENS; i++) {
    const r = L.DESP_ITEM_START + i;
    const it = itensDesp[i];
    input(ws.getCell(`A${r}`), it?.item ?? null);
    input(ws.getCell(`B${r}`), it?.valor ?? null, MOEDA);
    input(ws.getCell(`C${r}`), it?.grupo ?? null);
  }
  if (!dados) {
    // Exemplo de formato em nota — NUNCA como valor nas colunas A-C: essa
    // tabela é somada por SUMIF, então um "exemplo" com número de verdade
    // vira despesa fantasma no Dashboard até alguém apagar a linha. (Foi
    // exatamente esse bug que a verificação com hyperformula pegou aqui.)
    const r = L.DESP_ITEM_START;
    ws.getCell(`E${r}`).value = 'Formato esperado: "OLEO DIESEL" | R$ 1.000,00 | frota — ver LEIA-ME';
    ws.getCell(`E${r}`).font = { name: FONTE, size: 9, italic: true, color: { argb: "FF808080" } };
  }

  const rangeValor = `$B$${L.DESP_ITEM_START}:$B$${L.DESP_ITEM_END}`;
  const rangeGrupo = `$C$${L.DESP_ITEM_START}:$C$${L.DESP_ITEM_END}`;

  tituloSecao(ws.getCell(`A${L.RESUMO_DESP_HEADER}`), "RESUMO DE DESPESAS POR GRUPO (soma automática da tabela acima)");
  ws.mergeCells(`A${L.RESUMO_DESP_HEADER}:B${L.RESUMO_DESP_HEADER}`);
  for (const [codigo, rotulo, chaveLinha] of GRUPOS_REAIS) {
    const r = L[chaveLinha];
    ws.getCell(`A${r}`).value = rotulo;
    formula(ws.getCell(`B${r}`), `=SUMIF(${rangeGrupo},"${codigo}",${rangeValor})`, MOEDA);
  }
  ws.getCell(`A${L.ESTRUTURA}`).value = "Despesas de estrutura (soma dos grupos acima)";
  ws.getCell(`A${L.ESTRUTURA}`).font = { name: FONTE, size: 10, bold: true };
  formula(ws.getCell(`B${L.ESTRUTURA}`), `=SUM(B${L.G_FROTA}:B${L.G_TRIBUTOS})`, MOEDA);
  ws.getCell(`B${L.ESTRUTURA}`).font = { name: FONTE, size: 10, bold: true };

  for (const [codigo, rotulo, chaveLinha] of GRUPOS_EXCLUIDOS) {
    const r = L[chaveLinha];
    ws.getCell(`A${r}`).value = rotulo;
    formula(ws.getCell(`B${r}`), `=SUMIF(${rangeGrupo},"${codigo}",${rangeValor})`, MOEDA);
  }
  ws.getCell(`A${L.TOTAL_CALC}`).value = "Total calculado (estrutura + excluídos)";
  formula(ws.getCell(`B${L.TOTAL_CALC}`), `=B${L.ESTRUTURA}+B${L.G_EXCLUIDO_DECISAO}+B${L.G_SOBREPOE_FRETE}+B${L.G_NAO_DESPESA}`, MOEDA);
  ws.getCell(`A${L.TOTAL_IMPRESSO}`).value = "Total impresso no relatório (conferência — cole aqui o \"Total Geral\")";
  input(ws.getCell(`B${L.TOTAL_IMPRESSO}`), dados?.despesas_pagas?.total_relatorio ?? 0, MOEDA);
  ws.getCell(`A${L.DIFERENCA}`).value = "Diferença (deve ser zero — se não for, algum item ficou de fora)";
  formula(ws.getCell(`B${L.DIFERENCA}`), `=ROUND(B${L.TOTAL_CALC}-B${L.TOTAL_IMPRESSO},2)`, MOEDA);

  // --- Outras receitas ---
  tituloSecao(ws.getCell(`A${L.REC_HEADER}`), "OUTRAS RECEITAS — DETALHE POR GRUPO (editável)");
  ws.mergeCells(`A${L.REC_HEADER}:C${L.REC_HEADER}`);
  cabecalhoColuna(ws.getCell(`A${L.REC_COLHEAD}`), "Grupo");
  cabecalhoColuna(ws.getCell(`B${L.REC_COLHEAD}`), "Valor (R$)");
  cabecalhoColuna(ws.getCell(`C${L.REC_COLHEAD}`), 'Excluído? ("sim"/"não")');
  const gruposRec = dados?.outras_receitas?.grupos ?? [];
  for (let i = 0; i < L.N_REC_GRUPOS; i++) {
    const r = L.REC_GRUPO_START + i;
    const g = gruposRec[i];
    input(ws.getCell(`A${r}`), g?.grupo ?? null);
    input(ws.getCell(`B${r}`), g?.valor ?? null, MOEDA);
    input(ws.getCell(`C${r}`), g ? (g.excluido ? "sim" : "não") : null);
  }
  if (!dados) {
    // Mesmo cuidado da tabela de despesas: exemplo em nota (coluna E), nunca
    // como valor real dentro do range somado por SUMIF.
    const r = L.REC_GRUPO_START;
    ws.getCell(`E${r}`).value = 'Formato: "ADMINISTRATIVO" | R$ 500,00 | não — "RECEITA OPERACIONAL" é sempre "sim" (já está na lucratividade)';
    ws.getCell(`E${r}`).font = { name: FONTE, size: 9, italic: true, color: { argb: "FF808080" } };
  }

  tituloSecao(ws.getCell(`A${L.REC_EXCL_HEADER}`), 'ITENS EXCLUÍDOS INDIVIDUALMENTE (ex: reembolsos — editável)');
  ws.mergeCells(`A${L.REC_EXCL_HEADER}:B${L.REC_EXCL_HEADER}`);
  cabecalhoColuna(ws.getCell(`A${L.REC_EXCL_COLHEAD}`), "Item");
  cabecalhoColuna(ws.getCell(`B${L.REC_EXCL_COLHEAD}`), "Valor (R$)");
  const itensExclRec = dados?.outras_receitas?.itens_excluidos ?? [];
  for (let i = 0; i < L.N_REC_EXCL; i++) {
    const r = L.REC_EXCL_START + i;
    const it = itensExclRec[i];
    input(ws.getCell(`A${r}`), it?.item ?? null);
    input(ws.getCell(`B${r}`), it?.valor ?? null, MOEDA);
  }

  const rangeRecValor = `$B$${L.REC_GRUPO_START}:$B$${L.REC_GRUPO_END}`;
  const rangeRecExcl = `$C$${L.REC_GRUPO_START}:$C$${L.REC_GRUPO_END}`;
  const rangeRecExclValor = `$B$${L.REC_EXCL_START}:$B$${L.REC_EXCL_END}`;

  tituloSecao(ws.getCell(`A${L.RESUMO_REC_HEADER}`), "RESUMO DE OUTRAS RECEITAS");
  ws.mergeCells(`A${L.RESUMO_REC_HEADER}:B${L.RESUMO_REC_HEADER}`);
  ws.getCell(`A${L.REC_BRUTA}`).value = 'Receita dos grupos não excluídos (Excluído = "não")';
  formula(ws.getCell(`B${L.REC_BRUTA}`), `=SUMIF(${rangeRecExcl},"não",${rangeRecValor})`, MOEDA);
  ws.getCell(`A${L.REC_EXCL_TOTAL}`).value = "(-) Itens excluídos individualmente";
  formula(ws.getCell(`B${L.REC_EXCL_TOTAL}`), `=SUM(${rangeRecExclValor})`, MOEDA);
  ws.getCell(`A${L.REC_LIQUIDA}`).value = "Outras receitas líquidas";
  ws.getCell(`A${L.REC_LIQUIDA}`).font = { name: FONTE, size: 10, bold: true };
  formula(ws.getCell(`B${L.REC_LIQUIDA}`), `=B${L.REC_BRUTA}-B${L.REC_EXCL_TOTAL}`, MOEDA);
  ws.getCell(`B${L.REC_LIQUIDA}`).font = { name: FONTE, size: 10, bold: true };

  // --- Resultado ---
  tituloSecao(ws.getCell(`A${L.RESULTADO_HEADER}`), "RESULTADO CONSOLIDADO");
  ws.mergeCells(`A${L.RESULTADO_HEADER}:B${L.RESULTADO_HEADER}`);
  ws.getCell(`A${L.RES_MARGEM}`).value = "Margem de frete";
  formula(ws.getCell(`B${L.RES_MARGEM}`), `=B${L.MARGEM}`, MOEDA);
  ws.getCell(`A${L.RES_OUTRAS}`).value = "(+) Outras receitas líquidas";
  formula(ws.getCell(`B${L.RES_OUTRAS}`), `=B${L.REC_LIQUIDA}`, MOEDA);
  ws.getCell(`A${L.RES_DESPESAS}`).value = "(-) Despesas de estrutura";
  formula(ws.getCell(`B${L.RES_DESPESAS}`), `=B${L.ESTRUTURA}`, MOEDA);
  ws.getCell(`A${L.RESULTADO}`).value = "RESULTADO DO MÊS";
  ws.getCell(`A${L.RESULTADO}`).font = { name: FONTE, size: 11, bold: true };
  formula(ws.getCell(`B${L.RESULTADO}`), `=B${L.RES_MARGEM}+B${L.RES_OUTRAS}-B${L.RES_DESPESAS}`, MOEDA);
  ws.getCell(`B${L.RESULTADO}`).font = { name: FONTE, size: 11, bold: true };
  ws.getCell(`A${L.MARGEM_LIQ_PCT}`).value = "Margem líquida % sobre a receita";
  formula(ws.getCell(`B${L.MARGEM_LIQ_PCT}`), `=IFERROR(B${L.RESULTADO}/B${L.RECEITA},0)`, PCT);

  if (!dados) {
    ws.getCell(`A${L.SUBTITULO}`).value += " — MÊS AINDA NÃO PREENCHIDO (ver LEIA-ME)";
    ws.properties.tabColor = { argb: "FFCCCCCC" };
  }

  return ws;
}

// ---------------------------------------------------------------------------
function construirLeiame(wb, temPreenchido, temVazio) {
  const ws = wb.addWorksheet("LEIA-ME", { properties: { tabColor: { argb: "FF595D6C" } } });
  ws.getColumn(1).width = 100;
  const linhas = [
    ["EGM TRANSPORTES E LOGISTICA LTDA — Auditoria de Demonstrativos", true, 13],
    ["Planilha gerada a partir dos relatórios PDF do ERP (Lucratividade de Viagens, Despesas Pagas, Receitas Gerais).", false, 10],
    ["", false, 10],
    ["COMO ESTÁ ORGANIZADA", true, 11],
    ["• Uma aba por mês (JAN a DEZ/2026). Toda aba tem exatamente a mesma estrutura, linha por linha — é isso que permite ao Dashboard ler todas por fórmula.", false, 10],
    ["• Aba DASHBOARD: soma e compara os 12 meses automaticamente. Não precisa mexer nela — ela se atualiza sozinha conforme as abas de mês mudam.", false, 10],
    ["• Aba METODOLOGIA: o mesmo texto de critérios que já acompanhava o relatório em HTML.", false, 10],
    ["", false, 10],
    ["CORES (convenção)", true, 11],
    ["• Azul = valor de entrada (você pode editar).", false, 10, "0000FF"],
    ["• Preto = fórmula (não edite — ela recalcula sozinha a partir das células azuis).", false, 10],
    ["", false, 10],
    ["COMO PREENCHER UM MÊS NOVO (AGO a DEZ)", true, 11],
    ["1. Rode o pipeline de extração nos 3 PDFs do mês (LUCRATIVIDADE, DESPESAS PAGAS, RECEITAS DIVERSAS) — ele já confere os totais ao centavo contra o que o ERP imprime.", false, 10],
    ["2. Na aba do mês: preencha Viagens, Clientes, Receita de frete e Margem de frete (linhas 5-8) com os números do relatório de lucratividade.", false, 10],
    ["3. Na tabela \"DESPESAS PAGAS — DETALHE POR ITEM\" (linha 13 em diante), cole um item por linha: nome, valor, e o código do grupo (frota / administrativo / socios / comercial / financeiro / pessoal / perdas / tributos_nao_frete / excluido_decisao / sobrepoe_frete / nao_despesa).", false, 10],
    ["4. Preencha \"Total impresso no relatório\" (linha 108) com o Total Geral do PDF de despesas. A linha \"Diferença\" (109) tem de dar zero — se não der, sobrou item sem lançar.", false, 10],
    ["5. Na tabela \"OUTRAS RECEITAS\" (linha 113 em diante), um grupo por linha, marcando \"sim\"/\"não\" se é a Receita Operacional (que já está na lucratividade e deve ser excluída).", false, 10],
    ["6. Itens de receita vetados individualmente (como Reembolsos Diversos) vão na tabela da linha 136.", false, 10],
    ["7. Pronto — o resumo do mês (despesas por grupo, resultado) e o Dashboard recalculam sozinhos.", false, 10],
    ["", false, 10],
    ["DECISÕES DE CLASSIFICAÇÃO JÁ EMBUTIDAS (ver aba METODOLOGIA para o detalhe)", true, 11],
    ["• Desconto concedido: excluído do total de despesas (redutor de receita, não custo de estrutura).", false, 10],
    ["• ICMS, pedágio, fretes a pagar, seguro do frete: excluídos — já deduzidos dentro da margem de frete.", false, 10],
    ["• Adiantamentos, empréstimos, estornos: excluídos — são caixa, não despesa de resultado.", false, 10],
    ["• Receita Operacional (frete) no relatório de receitas: excluída — é a mesma receita já contada na lucratividade.", false, 10],
    ["• Reembolsos diversos: excluídos da receita — é dinheiro que volta, não receita ganha.", false, 10],
    ["", false, 10],
    [`Estado atual: ${temPreenchido.join(", ")} preenchidos com dados reais e conferidos · ${temVazio.join(", ")} aguardando dados.`, false, 10],
  ];
  linhas.forEach(([texto, negrito, tamanho, cor], i) => {
    const cell = ws.getCell(`A${i + 1}`);
    cell.value = texto;
    cell.font = { name: FONTE, size: tamanho, bold: !!negrito, color: cor ? { argb: "FF" + cor } : undefined };
    cell.alignment = { wrapText: true };
  });
  return ws;
}

// ---------------------------------------------------------------------------
function construirDashboard(wb) {
  const ws = wb.addWorksheet("DASHBOARD", { properties: { tabColor: { argb: "FF2A2C3A" } } });
  ws.getColumn(1).width = 30;
  for (let c = 2; c <= 14; c++) ws.getColumn(c).width = 14;

  ws.getCell("A1").value = "EGM TRANSPORTES E LOGISTICA LTDA — Dashboard Consolidado";
  ws.getCell("A1").font = { name: FONTE, size: 13, bold: true };
  ws.getCell("A2").value = "Todas as células abaixo são fórmulas — recalculam sozinhas conforme as abas de mês são preenchidas ou corrigidas.";
  ws.getCell("A2").font = { name: FONTE, size: 10, italic: true };

  // Tabela mensal ------------------------------------------------------
  const R_TAB_HEADER = 4;
  const R_TAB_START = 5;
  const R_TAB_END = R_TAB_START + 11; // 16
  const R_TAB_TOTAL = R_TAB_END + 1; // 17

  const colunas = [
    ["Mês", "A"],
    ["Viagens", "B"],
    ["Receita de frete", "C"],
    ["Margem de frete", "D"],
    ["Margem %", "E"],
    ["Despesas de estrutura", "F"],
    ["Outras receitas", "G"],
    ["Resultado", "H"],
    ["Resultado %", "I"],
  ];
  colunas.forEach(([nome, col]) => cabecalhoColuna(ws.getCell(`${col}${R_TAB_HEADER}`), nome));

  MESES.forEach(([sigla, , nomeCompleto], i) => {
    const r = R_TAB_START + i;
    ws.getCell(`A${r}`).value = `${nomeCompleto}/26`;
    ws.getCell(`A${r}`).font = { name: FONTE, size: 10 };
    formula(ws.getCell(`B${r}`), `='${sigla}'!B${L.VIAGENS}`, "#,##0");
    formula(ws.getCell(`C${r}`), `='${sigla}'!B${L.RECEITA}`, MOEDA);
    formula(ws.getCell(`D${r}`), `='${sigla}'!B${L.MARGEM}`, MOEDA);
    formula(ws.getCell(`E${r}`), `=IFERROR(D${r}/C${r},0)`, PCT);
    formula(ws.getCell(`F${r}`), `='${sigla}'!B${L.ESTRUTURA}`, MOEDA);
    formula(ws.getCell(`G${r}`), `='${sigla}'!B${L.REC_LIQUIDA}`, MOEDA);
    formula(ws.getCell(`H${r}`), `='${sigla}'!B${L.RESULTADO}`, MOEDA);
    formula(ws.getCell(`I${r}`), `=IFERROR(H${r}/C${r},0)`, PCT);
  });

  ws.getCell(`A${R_TAB_TOTAL}`).value = "TOTAL / ACUMULADO";
  ws.getCell(`A${R_TAB_TOTAL}`).font = { name: FONTE, size: 10, bold: true };
  for (const col of ["B", "C", "D", "F", "G", "H"]) {
    formula(ws.getCell(`${col}${R_TAB_TOTAL}`), `=SUM(${col}${R_TAB_START}:${col}${R_TAB_END})`, col === "B" ? "#,##0" : MOEDA);
    ws.getCell(`${col}${R_TAB_TOTAL}`).font = { name: FONTE, size: 10, bold: true };
  }
  formula(ws.getCell(`E${R_TAB_TOTAL}`), `=IFERROR(D${R_TAB_TOTAL}/C${R_TAB_TOTAL},0)`, PCT);
  formula(ws.getCell(`I${R_TAB_TOTAL}`), `=IFERROR(H${R_TAB_TOTAL}/C${R_TAB_TOTAL},0)`, PCT);
  ws.getCell(`E${R_TAB_TOTAL}`).font = { name: FONTE, size: 10, bold: true };
  ws.getCell(`I${R_TAB_TOTAL}`).font = { name: FONTE, size: 10, bold: true };

  // Heatmap despesas por grupo × mês -----------------------------------
  const R_HM_HEADER = R_TAB_TOTAL + 2; // 19
  const R_HM_COLHEAD = R_HM_HEADER + 1; // 20
  const R_HM_START = R_HM_COLHEAD + 1; // 21
  const R_HM_END = R_HM_START + GRUPOS_REAIS.length - 1; // 28
  const R_HM_TOTAL = R_HM_END + 1; // 29

  ws.getCell(`A${R_HM_HEADER}`).value = "DESPESAS DE ESTRUTURA POR GRUPO — MENSAL";
  ws.getCell(`A${R_HM_HEADER}`).font = { name: FONTE, size: 11, bold: true };
  cabecalhoColuna(ws.getCell(`A${R_HM_COLHEAD}`), "Grupo");
  MESES.forEach(([sigla], i) => {
    const col = String.fromCharCode("B".charCodeAt(0) + i); // B..M
    cabecalhoColuna(ws.getCell(`${col}${R_HM_COLHEAD}`), sigla);
  });
  cabecalhoColuna(ws.getCell(`N${R_HM_COLHEAD}`), "Total");

  GRUPOS_REAIS.forEach(([, rotulo, chaveLinha], gi) => {
    const r = R_HM_START + gi;
    ws.getCell(`A${r}`).value = rotulo;
    ws.getCell(`A${r}`).font = { name: FONTE, size: 10 };
    MESES.forEach(([sigla], mi) => {
      const col = String.fromCharCode("B".charCodeAt(0) + mi);
      formula(ws.getCell(`${col}${r}`), `='${sigla}'!B${L[chaveLinha]}`, MOEDA);
    });
    formula(ws.getCell(`N${r}`), `=SUM(B${r}:M${r})`, MOEDA);
    ws.getCell(`N${r}`).font = { name: FONTE, size: 10, bold: true };
  });
  ws.getCell(`A${R_HM_TOTAL}`).value = "Total (= Despesas de estrutura da tabela acima)";
  ws.getCell(`A${R_HM_TOTAL}`).font = { name: FONTE, size: 10, bold: true, italic: true };
  for (let mi = 0; mi < 12; mi++) {
    const col = String.fromCharCode("B".charCodeAt(0) + mi);
    formula(ws.getCell(`${col}${R_HM_TOTAL}`), `=SUM(${col}${R_HM_START}:${col}${R_HM_END})`, MOEDA);
  }
  formula(ws.getCell(`N${R_HM_TOTAL}`), `=SUM(N${R_HM_START}:N${R_HM_END})`, MOEDA);

  // Heatmap visual: escala de 3 cores sobre a rampa da marca (claro->escuro
  // = baixo->alto), a mesma lógica tonal usada no dashboard HTML.
  ws.addConditionalFormatting({
    ref: `B${R_HM_START}:M${R_HM_END}`,
    rules: [{
      type: "colorScale",
      cfvo: [{ type: "min" }, { type: "percentile", value: 50 }, { type: "max" }],
      color: [{ argb: "FF232532" }, { argb: "FF595D6C" }, { argb: "FFB2B6CA" }],
    }],
  });

  return { ws, R_TAB_START, R_TAB_END };
}

// ---------------------------------------------------------------------------
function construirMetodologia(wb) {
  const ws = wb.addWorksheet("METODOLOGIA", { properties: { tabColor: { argb: "FF595D6C" } } });
  ws.getColumn(1).width = 105;
  const pontos = [
    ["Critérios de classificação e exclusão", true, 13],
    ["", false, 10],
    ["Desconto concedido: excluído do total de despesas por decisão do cliente (ago/2026). É redutor de receita, não custo de estrutura — pressupõe que a receita de frete já vem líquida desse desconto.", false, 10],
    ["ICMS, pedágio, fretes a pagar, seguro do frete: excluídos — já estão deduzidos dentro da Margem de Frete do relatório de lucratividade. Somar de novo contaria em dobro.", false, 10],
    ["Adiantamentos a fornecedor, empréstimos a terceiros, adiantamento a sócio, estornos: excluídos — são movimentação de caixa (saem e voltam), não despesa de resultado.", false, 10],
    ["Receita Operacional no relatório de Receitas Gerais: excluída — é a receita de frete (\"Receita com Fretes\"), a mesma já apurada viagem a viagem no relatório de lucratividade.", false, 10],
    ["Reembolsos diversos: excluídos da receita — reembolso é recomposição de caixa que já foi gasto, não receita ganha.", false, 10],
    ["Clientes de margem acumulada negativa: removidos do relatório por decisão do cliente. Nenhum caso identificado nos relatórios mensais de jan-jul/2026 (a divergência encontrada nos relatórios agregados veio de diferença de escopo entre os dois conjuntos de export, não de clientes deficitários).", false, 10],
    ["", false, 10],
    ["Qual é a base da \"Receita de frete\" em cada aba de mês", true, 11],
    ["É a soma do campo Frete Empresa viagem a viagem, a mesma base usada no Dashboard e em toda a série mensal — não o \"Total Receitas\" que o relatório de lucratividade imprime no rodapé. Esse total impresso soma mais dois componentes que só existem no agregado do período (pedágio não embutido, outros descontos do motorista), não por viagem individual, então não dá para reconstruí-lo aqui viagem a viagem. A diferença entre as duas bases varia por mês (de ~0,5% a ~6% da receita); o valor impresso pelo ERP fica anotado ao lado do campo, célula E7 de cada aba, só para conferência — não entra em nenhuma soma.", false, 10],
    ["", false, 10],
    ["Por que a receita de frete não soma com a Receita Operacional das Receitas Gerais", true, 11],
    ["Os dois relatórios medem coisas diferentes que se sobrepõem: a Lucratividade apura por competência (viagem emitida) e a Receita Operacional das Receitas Gerais é a mesma receita de frete, só que solta por fatura. Somar os dois contaria o frete duas vezes.", false, 10],
    ["", false, 10],
    ["Sobre o corte mensal", true, 11],
    ["Receita e margem: vêm das linhas de viagem individuais do relatório de lucratividade, com data própria por viagem — corte mensal é direto e cada mês fecha ao centavo com o total impresso.", false, 10],
    ["Despesas: cada aba de mês corresponde a um relatório de Despesas Pagas que já filtra por data de PAGAMENTO no próprio PDF de origem — por isso o corte mensal aqui é confiável. (Um único relatório semestral não permitiria isso: cada lançamento traz a data de EMISSÃO da nota, não a de pagamento.)", false, 10],
    ["", false, 10],
    ["Conferência embutida em cada aba", true, 11],
    ["Linha \"Diferença\" (109): soma dos itens classificados menos o total impresso no relatório de despesas. Tem de ser zero — um valor diferente de zero significa item sem lançar ou classificado errado.", false, 10],
  ];
  pontos.forEach(([texto, negrito, tamanho], i) => {
    const cell = ws.getCell(`A${i + 1}`);
    cell.value = texto;
    cell.font = { name: FONTE, size: tamanho, bold: !!negrito };
    cell.alignment = { wrapText: true };
  });
  return ws;
}

// ---------------------------------------------------------------------------
async function main() {
  const saida = process.argv[2] ?? path.join(RAIZ, "outputs", "EGM_Auditoria_2026.xlsx");

  const wb = new ExcelJS.Workbook();
  wb.creator = "Auditoria BPO — Dabliw";
  wb.created = new Date();

  // Lê antes de criar qualquer aba — a ordem de escrita no exceljs É a ordem
  // final no arquivo, não dá para reordenar depois (uma tentativa anterior
  // de mexer em wb._worksheets não teve efeito no arquivo salvo).
  const dadosPorMes = MESES.map(([sigla, numero, nomeCompleto]) => {
    const arquivo = path.join(RAIZ, "outputs", "metrics", `mes_2026-${String(numero).padStart(2, "0")}.json`);
    const dados = fs.existsSync(arquivo) ? JSON.parse(fs.readFileSync(arquivo, "utf8")) : null;
    return { sigla, numero, nomeCompleto, dados };
  });
  const preenchidos = dadosPorMes.filter((m) => m.dados).map((m) => m.sigla);
  const vazios = dadosPorMes.filter((m) => !m.dados).map((m) => m.sigla);

  construirLeiame(wb, preenchidos, vazios);
  construirDashboard(wb);
  construirMetodologia(wb);
  for (const { sigla, numero, nomeCompleto, dados } of dadosPorMes) {
    construirAbaMes(wb, sigla, numero, nomeCompleto, dados);
  }

  fs.mkdirSync(path.dirname(saida), { recursive: true });
  await wb.xlsx.writeFile(saida);
  console.log(saida);
  console.log(`Preenchidos: ${preenchidos.join(", ")} | Vazios: ${vazios.join(", ")}`);
}

main();
