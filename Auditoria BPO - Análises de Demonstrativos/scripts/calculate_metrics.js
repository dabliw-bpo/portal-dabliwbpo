#!/usr/bin/env node
// Cálculo determinístico de KPIs financeiros a partir de lançamentos
// categorizados. Usado pelo agente `financial-analyst`
// (CLAUDE.md nesta pasta) — nunca deve ser substituído por uma
// estimativa feita "de cabeça" pelo agente: todo número do dashboard passa
// por aqui.
//
// Uso:
//   node calculate_metrics.js caminho/para/categorized.json
// Imprime o JSON de métricas em stdout.

import fs from "node:fs";

function parsePeriod(lancamentos) {
  if (lancamentos.length === 0) {
    const hoje = new Date().toISOString().slice(0, 10);
    return [hoje, hoje];
  }
  const datas = lancamentos.map((l) => l.data).sort();
  return [datas[0], datas[datas.length - 1]];
}

function calculateMetrics(payload) {
  const lancamentos = payload.lancamentos ?? [];
  const alertas = [];

  if (lancamentos.length === 0) {
    alertas.push("Nenhum lançamento categorizado disponível para este período.");
    return {
      periodo: { inicio: null, fim: null },
      receita_total: 0,
      despesa_total: 0,
      saldo: 0,
      margem_pct: null,
      variacao_mom_pct: null,
      top_categorias: [],
      alertas,
    };
  }

  const [inicio, fim] = parsePeriod(lancamentos);

  const receitaTotal = lancamentos
    .filter((l) => l.tipo === "entrada")
    .reduce((acc, l) => acc + l.valor, 0);
  const despesaTotal = lancamentos
    .filter((l) => l.tipo === "saida")
    .reduce((acc, l) => acc + l.valor, 0);
  const saldo = receitaTotal - despesaTotal;
  const margemPct = receitaTotal ? (saldo / receitaTotal) * 100 : null;

  const porCategoria = new Map();
  for (const l of lancamentos) {
    const cat = l.categoria ?? "outros";
    porCategoria.set(cat, (porCategoria.get(cat) ?? 0) + Math.abs(l.valor));
  }
  const totalMovimentado = [...porCategoria.values()].reduce((a, b) => a + b, 0) || 1;

  const topCategorias = [...porCategoria.entries()]
    .map(([categoria, total]) => ({
      categoria,
      total: Math.round(total * 100) / 100,
      pct_do_total: Math.round((total / totalMovimentado) * 10000) / 100,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (receitaTotal === 0) {
    alertas.push("Nenhuma receita identificada no período — confira os exports de faturamento.");
  }
  if (despesaTotal > receitaTotal && receitaTotal > 0) {
    alertas.push("Despesas superaram a receita no período.");
  }

  return {
    periodo: { inicio, fim },
    receita_total: Math.round(receitaTotal * 100) / 100,
    despesa_total: Math.round(despesaTotal * 100) / 100,
    saldo: Math.round(saldo * 100) / 100,
    margem_pct: margemPct !== null ? Math.round(margemPct * 100) / 100 : null,
    // Comparação mês a mês requer o histórico de rodadas anteriores, fora do
    // escopo deste cálculo single-shot — o agente decide null vs. valor real
    // ao comparar com uma métrica anterior salva em outputs/metrics/.
    variacao_mom_pct: null,
    top_categorias: topCategorias,
    alertas,
  };
}

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error("uso: node calculate_metrics.js <categorized.json>");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
console.log(JSON.stringify(calculateMetrics(payload), null, 2));
