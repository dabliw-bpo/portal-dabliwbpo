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

// Decisão do cliente (ago/2026): clientes cuja margem acumulada no período é
// negativa saem inteiramente do relatório — receita, margem e viagens.
//
// CONSEQUÊNCIA, e por isso o relatório declara isso em destaque: os totais
// deixam de reconciliar com os totais impressos pelo ERP. A margem publicada
// passa a ser a margem dos clientes lucrativos, não a margem da empresa. Use
// --incluir-margem-negativa para voltar ao número que fecha com o ERP.
const EXCLUIR_MARGEM_NEGATIVA = !process.argv.includes("--incluir-margem-negativa");

const arquivos = process.argv.slice(2).filter((a) => !a.startsWith("--"));
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

// Tudo abaixo é derivado do cruzamento mês × cliente, e não dos agregados
// prontos: assim uma exclusão de cliente propaga para a série mensal também.
const cruzado = periodos.flatMap((p) => p.operacao_frete.por_mes_cliente ?? []);

// Margem acumulada por cliente no período inteiro decide a exclusão. Fosse
// mês a mês, um mesmo cliente entraria e sairia conforme o mês, e a série
// mensal deixaria de ser comparável.
const acumuladoCliente = new Map();
for (const r of cruzado) {
  const acc = acumuladoCliente.get(r.cliente) ?? {
    nome: r.cliente,
    valor: 0,
    margem: 0,
    viagens: 0,
  };
  acc.valor += r.frete_empresa;
  acc.margem += r.margem;
  acc.viagens += r.viagens;
  acumuladoCliente.set(r.cliente, acc);
}

const excluidos = EXCLUIR_MARGEM_NEGATIVA
  ? [...acumuladoCliente.values()]
      .filter((c) => c.margem < 0)
      .map((c) => ({
        nome: c.nome,
        valor: Number(c.valor.toFixed(2)),
        margem: Number(c.margem.toFixed(2)),
        viagens: c.viagens,
        margem_pct: Number(((c.margem / c.valor) * 100).toFixed(2)),
      }))
      .sort((a, b) => a.margem - b.margem)
  : [];
const nomesExcluidos = new Set(excluidos.map((c) => c.nome));

const cruzadoFiltrado = cruzado.filter((r) => !nomesExcluidos.has(r.cliente));

// Série mensal, recomposta a partir do cruzamento já filtrado.
const mensalMap = new Map();
for (const r of cruzadoFiltrado) {
  const acc = mensalMap.get(r.mes) ?? { mes: r.mes, viagens: 0, receita: 0, margem: 0 };
  acc.viagens += r.viagens;
  acc.receita += r.frete_empresa;
  acc.margem += r.margem;
  mensalMap.set(r.mes, acc);
}
const mensal = [...mensalMap.values()]
  .map((m) => ({
    ...m,
    receita: Number(m.receita.toFixed(2)),
    margem: Number(m.margem.toFixed(2)),
    margem_pct: Number(((m.margem / m.receita) * 100).toFixed(2)),
  }))
  .sort((a, b) => a.mes.localeCompare(b.mes));

const clientesArr = [...acumuladoCliente.values()]
  .filter((c) => !nomesExcluidos.has(c.nome))
  .map((c) => ({
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

// Totais vêm do conjunto FILTRADO, não dos totais impressos pelo ERP — é
// exatamente isso que a exclusão de clientes implica.
const receitaTotal = mensal.reduce((a, m) => a + m.receita, 0);
const margemTotal = mensal.reduce((a, m) => a + m.margem, 0);
const viagensTotal = mensal.reduce((a, m) => a + m.viagens, 0);
const margemErp = soma((p) => p.operacao_frete.margem_frete);
const estruturaTotal = soma((p) => p.despesas_pagas.despesas_estrutura);
const outrasReceitasTotal = soma((p) => p.consolidado.outras_receitas ?? 0);
const resultado = margemTotal + outrasReceitasTotal - estruturaTotal;

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

  clientes_excluidos: {
    ativo: EXCLUIR_MARGEM_NEGATIVA,
    criterio: "margem acumulada negativa no período",
    quantidade: excluidos.length,
    receita_removida: Number(excluidos.reduce((a, c) => a + c.valor, 0).toFixed(2)),
    margem_removida: Number(excluidos.reduce((a, c) => a + c.margem, 0).toFixed(2)),
    viagens_removidas: excluidos.reduce((a, c) => a + c.viagens, 0),
    margem_erp: Number(margemErp.toFixed(2)),
    clientes: excluidos,
  },

  operacao_frete: {
    total_viagens: viagensTotal,
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

  outras_receitas: {
    total: Number(outrasReceitasTotal.toFixed(2)),
    nota: "Receitas gerais sem o grupo RECEITA OPERACIONAL, que é o frete já apurado na lucratividade.",
    excluido_receita_operacional: Number(
      soma((p) => p.outras_receitas?.excluido_receita_operacional ?? 0).toFixed(2),
    ),
    excluido_itens: Number(
      soma((p) => p.outras_receitas?.excluido_itens ?? 0).toFixed(2),
    ),
    itens_excluidos: periodos.flatMap((p) => p.outras_receitas?.itens_excluidos ?? []),
  },

  consolidado: {
    margem_frete: Number(margemTotal.toFixed(2)),
    outras_receitas: Number(outrasReceitasTotal.toFixed(2)),
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

  if (excluidos.length > 0) {
    a.push(
      `ATENÇÃO — este relatório NÃO reconcilia com o ERP: ${excluidos.length} clientes de margem negativa foram removidos, tirando ${brl(excluidos.reduce((s, c) => s + c.valor, 0))} de receita e ${brl(Math.abs(excluidos.reduce((s, c) => s + c.margem, 0)))} de prejuízo dos totais. A margem de ${pctFmt((margemTotal / receitaTotal) * 100)} aqui é a dos clientes lucrativos; a margem da empresa segundo o ERP é ${brl(margemErp)}.`,
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

  const itensRecExcl = periodos.flatMap((p) => p.outras_receitas?.itens_excluidos ?? []);
  if (itensRecExcl.length > 0) {
    const tot = itensRecExcl.reduce((s, i) => s + i.valor, 0);
    const nomes = [...new Set(itensRecExcl.map((i) => i.item))].join(", ");
    a.push(
      `${brl(tot)} de receita foram excluídos por decisão (${nomes}) em ${itensRecExcl.length} ocorrências do período — reembolso é recomposição de caixa, não receita ganha.`,
    );
  }

  a.push(
    "Despesas não têm corte mensal: o relatório filtra por data de pagamento, mas imprime a data de emissão da nota. Para a curva ABC mensal de despesas, exporte um relatório de Despesas Gerais por mês.",
  );
  return a;
}

console.log(JSON.stringify(consolidado, null, 2));
