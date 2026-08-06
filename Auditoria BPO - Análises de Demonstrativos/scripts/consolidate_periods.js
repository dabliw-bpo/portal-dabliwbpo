#!/usr/bin/env node
// Une vários períodos num único conjunto de métricas, com série mensal e
// curvas ABC.
//
// Uso:
//   node consolidate_periods.js <metrics_a.json> <metrics_b.json> [...] > consolidado.json
//
// Cada arquivo de entrada é a saída de analyze_reports.js. A união é feita
// somando o que é somável e concatenando as séries mensais.
//
// LIMITE CONHECIDO — despesas não têm corte mensal.
// O relatório de despesas filtra por data de PAGAMENTO, mas a data impressa
// em cada linha é a de EMISSÃO da nota. Um corte mensal por essa data
// responderia "quanto paguei de notas emitidas em cada mês", que não é a
// pergunta. Por isso a série mensal cobre receita e margem (vindas das linhas
// de viagem, conferidas contra os totais do ERP) e as despesas aparecem por
// período de relatório. Para despesas mês a mês, exporte um relatório por mês.

import fs from "node:fs";

const arquivos = process.argv.slice(2);
if (arquivos.length === 0) {
  console.error("uso: node consolidate_periods.js <metrics.json> [...]");
  process.exit(1);
}

const periodos = arquivos.map((a) => JSON.parse(fs.readFileSync(a, "utf8")));

// --- Curva ABC ------------------------------------------------------------
// Classe A: itens que acumulam até 80% do total. B: até 95%. C: o resto.
// Devolve os itens ordenados com o acumulado, que é o que o gráfico desenha.
function curvaABC(itens, chaveValor = "valor", chaveNome = "nome") {
  const ordenados = [...itens].sort((a, b) => b[chaveValor] - a[chaveValor]);
  const total = ordenados.reduce((acc, i) => acc + i[chaveValor], 0) || 1;
  let acumulado = 0;
  return ordenados.map((i) => {
    acumulado += i[chaveValor];
    const pctAcum = (acumulado / total) * 100;
    return {
      nome: i[chaveNome],
      valor: Number(i[chaveValor].toFixed(2)),
      pct: Number(((i[chaveValor] / total) * 100).toFixed(2)),
      pct_acumulado: Number(pctAcum.toFixed(2)),
      classe: pctAcum <= 80 ? "A" : pctAcum <= 95 ? "B" : "C",
    };
  });
}

function resumoABC(curva) {
  const por = (c) => curva.filter((i) => i.classe === c);
  return ["A", "B", "C"].map((c) => {
    const itens = por(c);
    return {
      classe: c,
      itens: itens.length,
      valor: Number(itens.reduce((a, i) => a + i.valor, 0).toFixed(2)),
      pct: Number(itens.reduce((a, i) => a + i.pct, 0).toFixed(2)),
    };
  });
}

// --- União dos períodos ---------------------------------------------------
const soma = (f) => periodos.reduce((a, p) => a + f(p), 0);

// Série mensal de receita/margem: vem das linhas de viagem já validadas.
const mensal = [];
for (const p of periodos) {
  for (const m of p.operacao_frete.por_mes ?? []) {
    mensal.push({
      mes: m.mes,
      viagens: m.viagens,
      receita: m.frete_empresa,
      margem: m.margem,
      margem_pct: m.margem_pct,
    });
  }
}
mensal.sort((a, b) => a.mes.localeCompare(b.mes));

// Faturamento por cliente: soma entre períodos pelo nome.
const clientes = new Map();
for (const p of periodos) {
  for (const c of p.operacao_frete.por_cliente ?? []) {
    const acc = clientes.get(c.cliente) ?? {
      nome: c.cliente,
      valor: 0,
      margem: 0,
      viagens: 0,
    };
    acc.valor += c.frete_empresa;
    acc.margem += c.margem;
    acc.viagens += c.viagens;
    clientes.set(c.cliente, acc);
  }
}
const clientesArr = [...clientes.values()].map((c) => ({
  ...c,
  valor: Number(c.valor.toFixed(2)),
  margem: Number(c.margem.toFixed(2)),
  margem_pct: Number(((c.margem / c.valor) * 100).toFixed(2)),
}));

// Despesas por item: soma entre períodos pelo código.
const itensDesp = new Map();
for (const p of periodos) {
  for (const g of p.despesas_pagas.grupos) {
    for (const i of g.itens) {
      const acc = itensDesp.get(i.codigo) ?? {
        nome: i.item,
        codigo: i.codigo,
        grupo: g.grupo,
        rotulo_grupo: g.rotulo,
        valor: 0,
      };
      acc.valor += i.valor;
      itensDesp.set(i.codigo, acc);
    }
  }
}
const itensDespArr = [...itensDesp.values()].map((i) => ({
  ...i,
  valor: Number(i.valor.toFixed(2)),
}));

// Grupos somados entre períodos.
const grupos = new Map();
for (const p of periodos) {
  for (const g of p.despesas_pagas.grupos) {
    const acc = grupos.get(g.grupo) ?? { grupo: g.grupo, rotulo: g.rotulo, total: 0 };
    acc.total += g.total;
    grupos.set(g.grupo, acc);
  }
}
const totalRelatorio = soma((p) => p.despesas_pagas.total_relatorio);
const gruposArr = [...grupos.values()]
  .map((g) => ({
    ...g,
    total: Number(g.total.toFixed(2)),
    pct_do_relatorio: Number(((g.total / totalRelatorio) * 100).toFixed(2)),
  }))
  .sort((a, b) => b.total - a.total);

// Despesas de estrutura só entram no ABC "que importa" — o resto é excluído.
const itensEstrutura = itensDespArr.filter(
  (i) => !["excluido_decisao", "nao_despesa", "sobrepoe_frete"].includes(i.grupo),
);

const receitaTotal = mensal.reduce((a, m) => a + m.receita, 0);
const margemTotal = soma((p) => p.operacao_frete.margem_frete);
const estruturaTotal = soma((p) => p.despesas_pagas.despesas_estrutura);
const resultado = margemTotal - estruturaTotal;

// Melhor e pior mês por margem % — o que o descritivo mensal precisa dizer.
const porMargemPct = [...mensal].sort((a, b) => b.margem_pct - a.margem_pct);

const consolidado = {
  gerado_em: new Date().toISOString(),
  empresa: periodos[0].empresa,
  periodo: {
    inicio: periodos[0].periodo.inicio,
    fim: periodos[periodos.length - 1].periodo.fim,
  },
  periodos_unidos: periodos.map((p) => ({
    inicio: p.periodo.inicio,
    fim: p.periodo.fim,
    arquivos: p.arquivos_fonte,
  })),
  arquivos_fonte: periodos.flatMap((p) => p.arquivos_fonte),

  operacao_frete: {
    total_viagens: soma((p) => p.operacao_frete.total_viagens),
    receita_frete: Number(receitaTotal.toFixed(2)),
    margem_frete: Number(margemTotal.toFixed(2)),
    margem_pct: Number(((margemTotal / receitaTotal) * 100).toFixed(2)),
    clientes_distintos: clientesArr.length,
    melhor_mes: porMargemPct[0],
    pior_mes: porMargemPct[porMargemPct.length - 1],
  },

  mensal,

  despesas_pagas: {
    total_relatorio: Number(totalRelatorio.toFixed(2)),
    excluido_decisao: soma((p) => p.despesas_pagas.excluido_decisao ?? 0),
    nao_despesa: soma((p) => p.despesas_pagas.nao_despesa),
    sobrepoe_frete: soma((p) => p.despesas_pagas.sobrepoe_frete),
    despesas_estrutura: Number(estruturaTotal.toFixed(2)),
    grupos: gruposArr,
  },

  abc_despesas: {
    base: "Despesas de estrutura (exclui desconto concedido, adiantamentos e o que já está na margem de frete)",
    total: Number(itensEstrutura.reduce((a, i) => a + i.valor, 0).toFixed(2)),
    resumo: resumoABC(curvaABC(itensEstrutura)),
    itens: curvaABC(itensEstrutura),
  },

  abc_faturamento: {
    base: "Frete empresa por cliente, somado no período",
    total: Number(clientesArr.reduce((a, c) => a + c.valor, 0).toFixed(2)),
    resumo: resumoABC(curvaABC(clientesArr)),
    itens: curvaABC(clientesArr).map((i) => {
      const c = clientesArr.find((x) => x.nome === i.nome);
      return { ...i, margem: c.margem, margem_pct: c.margem_pct, viagens: c.viagens };
    }),
  },

  consolidado: {
    margem_frete: Number(margemTotal.toFixed(2)),
    despesas_estrutura: Number(estruturaTotal.toFixed(2)),
    resultado: Number(resultado.toFixed(2)),
    margem_liquida_pct: Number(((resultado / receitaTotal) * 100).toFixed(2)),
  },

  alertas: montarAlertas(),
};

// Alertas do consolidado são recalculados sobre os números somados. Concatenar
// os alertas de cada período geraria duplicatas com valores parciais ("margem
// de 10,53%" e "margem de 11,06%" lado a lado), que confundem mais do que
// informam. Só sobrevivem, individualizados, os avisos de evento pontual.
function montarAlertas() {
  const a = [];
  const brl = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pctFmt = (v) =>
    `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;

  const excluido = soma((p) => p.despesas_pagas.excluido_decisao ?? 0);
  if (excluido > 0) {
    a.push(
      `Desconto concedido de ${brl(excluido)} no período foi EXCLUÍDO do total de despesas por decisão. Isso pressupõe que a receita de frete já vem líquida desse desconto; se não vier, o resultado está superavaliado nesse valor.`,
    );
  }

  const naoDesp = soma((p) => p.despesas_pagas.nao_despesa);
  const totalRel = soma((p) => p.despesas_pagas.total_relatorio);
  if (naoDesp / totalRel > 0.15) {
    a.push(
      `${pctFmt((naoDesp / totalRel) * 100)} do que foi pago (${brl(naoDesp)}) são adiantamentos, empréstimos e estornos — saída de caixa, não despesa de resultado.`,
    );
  }

  const margemPct = (margemTotal / receitaTotal) * 100;
  if (margemPct < 15) {
    a.push(
      `Margem de frete de ${pctFmt(margemPct)} no período: cada 1% de erro de precificação move o resultado em ${brl(receitaTotal * 0.01)}.`,
    );
  }

  const negativos = clientesArr.filter((c) => c.margem < 0);
  if (negativos.length > 0) {
    a.push(
      `${negativos.length} clientes deram margem negativa, somando ${brl(negativos.reduce((s, c) => s + c.margem, 0))} de prejuízo.`,
    );
  }

  const abcFat = curvaABC(clientesArr);
  const top2 = abcFat.slice(0, 2);
  if (top2.length === 2 && top2[1].pct_acumulado > 70) {
    a.push(
      `Concentração de clientes: ${top2[0].nome} e ${top2[1].nome} respondem por ${pctFmt(top2[1].pct_acumulado)} do faturamento.`,
    );
  }

  // Eventos pontuais de um período específico não têm equivalente consolidado.
  for (const p of periodos) {
    for (const al of p.alertas) {
      if (/Perdas operacionais|sem classificação|Concentração: "/.test(al)) {
        a.push(`${p.periodo.inicio}–${p.periodo.fim}: ${al}`);
      }
    }
  }

  a.push(
    "Despesas não têm corte mensal: o relatório filtra por data de pagamento, mas imprime a data de emissão da nota. Para a curva ABC mensal de despesas, exporte um relatório de Despesas Gerais por mês.",
  );
  return a;
}

console.log(JSON.stringify(consolidado, null, 2));
