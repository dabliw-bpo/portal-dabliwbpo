#!/usr/bin/env node
// Dashboard consolidado multi-período: série mensal, curvas ABC e detalhe da
// margem de frete por cliente.
//
// Uso:
//   node build_dashboard_consolidado.js <consolidado.json> [saida.html]
//
// Paleta validada pelo validador da skill dataviz (categórica slots 1/2/3 e
// par divergente azul↔vermelho, aprovados em all-pairs nos dois modos).

import fs from "node:fs";
import path from "node:path";

const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlExato = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const mesLabel = (m) => {
  const [a, mm] = m.split("-");
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][+mm - 1]}/${a.slice(2)}`;
};

// --- Série mensal: barras de receita + linha de margem % -------------------
// Duas medidas de escalas diferentes. Regra da skill: nunca dois eixos y no
// mesmo gráfico — então são dois painéis empilhados, compartilhando o eixo x.
function serieMensal(mensal) {
  const L = 760, H = 200, padL = 64, padR = 16, padT = 18, padB = 26;
  const plotW = L - padL - padR, plotH = H - padT - padB;
  const maxRec = Math.max(...mensal.map((m) => m.receita));
  const bw = Math.min(56, (plotW / mensal.length) * 0.6);

  const barras = mensal.map((m, i) => {
    const cx = padL + (plotW / mensal.length) * (i + 0.5);
    const h = (m.receita / maxRec) * plotH;
    const y = padT + plotH - h;
    return `<g class="col" tabindex="0" aria-label="${mesLabel(m.mes)}: receita ${brlExato(m.receita)}, ${m.viagens} viagens">
      <rect class="hit" x="${(cx - plotW / mensal.length / 2).toFixed(1)}" y="${padT}" width="${(plotW / mensal.length).toFixed(1)}" height="${plotH}"></rect>
      <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="var(--s1)"></rect>
      <text class="vlabel sm" x="${cx.toFixed(1)}" y="${(y - 6).toFixed(1)}">${brl(m.receita)}</text>
      <text class="xlabel" x="${cx.toFixed(1)}" y="${H - 8}">${mesLabel(m.mes)}</text>
      <title>${mesLabel(m.mes)}: ${brlExato(m.receita)} · ${m.viagens} viagens</title>
    </g>`;
  }).join("");

  // Painel da margem %, mesma grade horizontal.
  const H2 = 150, plotH2 = H2 - padT - padB;
  const maxPct = Math.max(...mensal.map((m) => m.margem_pct)) * 1.15;
  const pontos = mensal.map((m, i) => {
    const cx = padL + (plotW / mensal.length) * (i + 0.5);
    const cy = padT + plotH2 - (m.margem_pct / maxPct) * plotH2;
    return { cx, cy, m };
  });
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ");
  const marcas = pontos.map((p) => `<g class="col" tabindex="0" aria-label="${mesLabel(p.m.mes)}: margem ${pct(p.m.margem_pct)}">
      <circle cx="${p.cx.toFixed(1)}" cy="${p.cy.toFixed(1)}" r="5" fill="var(--s2)" stroke="var(--surface-1)" stroke-width="2"></circle>
      <text class="vlabel sm" x="${p.cx.toFixed(1)}" y="${(p.cy - 11).toFixed(1)}">${pct(p.m.margem_pct)}</text>
      <title>${mesLabel(p.m.mes)}: margem ${pct(p.m.margem_pct)}</title>
    </g>`).join("");

  return `
  <div class="chartlabel">Receita de frete por mês</div>
  <svg viewBox="0 0 ${L} ${H}" role="img" class="chart">
    <line class="base" x1="${padL}" y1="${padT + plotH}" x2="${L - padR}" y2="${padT + plotH}"></line>
    ${barras}
  </svg>
  <div class="chartlabel">Margem de frete (%) por mês</div>
  <svg viewBox="0 0 ${L} ${H2}" role="img" class="chart">
    <line class="base" x1="${padL}" y1="${padT + plotH2}" x2="${L - padR}" y2="${padT + plotH2}"></line>
    <path d="${linha}" fill="none" stroke="var(--s2)" stroke-width="2"></path>
    ${marcas}
    ${pontos.map((p) => `<text class="xlabel" x="${p.cx.toFixed(1)}" y="${H2 - 8}">${mesLabel(p.m.mes)}</text>`).join("")}
  </svg>`;
}

// --- Curva ABC: barras por item + linha do acumulado ----------------------
function curvaABC(itens, { limite = 14, unidade = "" } = {}) {
  const mostra = itens.slice(0, limite);
  const L = 760, H = 260, padL = 8, padR = 46, padT = 20, padB = 64;
  const plotW = L - padL - padR, plotH = H - padT - padB;
  const max = Math.max(...mostra.map((i) => i.valor));
  const bw = Math.min(40, (plotW / mostra.length) * 0.62);
  const corClasse = { A: "var(--s1)", B: "var(--s2)", C: "var(--s3)" };

  const barras = mostra.map((it, i) => {
    const cx = padL + (plotW / mostra.length) * (i + 0.5);
    const h = Math.max(2, (it.valor / max) * plotH);
    const y = padT + plotH - h;
    const nome = it.nome.length > 20 ? it.nome.slice(0, 19) + "…" : it.nome;
    return `<g class="col" tabindex="0" aria-label="${esc(it.nome)}: ${brlExato(it.valor)}, classe ${it.classe}, acumulado ${pct(it.pct_acumulado)}">
      <rect class="hit" x="${(cx - plotW / mostra.length / 2).toFixed(1)}" y="${padT}" width="${(plotW / mostra.length).toFixed(1)}" height="${plotH}"></rect>
      <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${corClasse[it.classe]}"></rect>
      <text class="xlabel rot" transform="translate(${cx.toFixed(1)},${padT + plotH + 8}) rotate(35)">${esc(nome)}</text>
      <title>${esc(it.nome)} — ${brlExato(it.valor)} (${pct(it.pct)}) · classe ${it.classe} · acumulado ${pct(it.pct_acumulado)}</title>
    </g>`;
  }).join("");

  const pts = mostra.map((it, i) => {
    const cx = padL + (plotW / mostra.length) * (i + 0.5);
    const cy = padT + plotH - (it.pct_acumulado / 100) * plotH;
    return `${i ? "L" : "M"}${cx.toFixed(1)},${cy.toFixed(1)}`;
  }).join(" ");
  const marcas = mostra.map((it, i) => {
    const cx = padL + (plotW / mostra.length) * (i + 0.5);
    const cy = padT + plotH - (it.pct_acumulado / 100) * plotH;
    return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="var(--sub)"></circle>`;
  }).join("");
  const y80 = padT + plotH - 0.8 * plotH;

  return `<svg viewBox="0 0 ${L} ${H}" role="img" class="chart">
    <line class="grid80" x1="${padL}" y1="${y80.toFixed(1)}" x2="${L - padR}" y2="${y80.toFixed(1)}"></line>
    <text class="glabel" x="${L - padR + 4}" y="${(y80 + 4).toFixed(1)}">80%</text>
    <line class="base" x1="${padL}" y1="${padT + plotH}" x2="${L - padR}" y2="${padT + plotH}"></line>
    ${barras}
    <path d="${pts}" fill="none" stroke="var(--sub)" stroke-width="2"></path>
    ${marcas}
  </svg>
  <p class="note">Linha cinza = % acumulado. ${unidade} além do ${limite}º não aparecem no gráfico, mas estão na tabela.</p>`;
}

// --------------------------------------------------------------------------
const [, , entrada, saidaArg] = process.argv;
if (!entrada) {
  console.error("uso: node build_dashboard_consolidado.js <consolidado.json> [saida.html]");
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(entrada, "utf8"));
const op = d.operacao_frete, dp = d.despesas_pagas, co = d.consolidado;

const negativos = d.abc_faturamento.itens
  .filter((i) => i.margem_pct < 0)
  .sort((a, b) => a.margem - b.margem);
const prejuizoClientes = negativos.reduce((a, i) => a + i.margem, 0);

const tiles = [
  { r: "Receita de frete", v: brl(op.receita_frete), s: `${op.total_viagens.toLocaleString("pt-BR")} viagens · ${op.clientes_distintos} clientes` },
  { r: "Margem de frete", v: brl(op.margem_frete), s: pct(op.margem_pct) + " da receita", destaque: true },
  { r: "Despesas de estrutura", v: brl(dp.despesas_estrutura), s: `de ${brl(dp.total_relatorio)} pagos` },
  { r: "Resultado", v: brl(co.resultado), s: pct(co.margem_liquida_pct) + " da receita", estado: co.resultado >= 0 ? "good" : "critical" },
];

const html = `<title>Auditoria BPO — ${esc(d.empresa)} — ${esc(d.periodo.inicio)} a ${esc(d.periodo.fim)}</title>
<style>
  .viz-root{color-scheme:light;
    --surface-1:#fcfcfb;--plane:#f9f9f7;--text-primary:#0b0b0b;--text-secondary:#52514e;--muted:#898781;
    --grid:#e1e0d9;--baseline:#c3c2b7;--border:rgba(11,11,11,.10);
    --s1:#2a78d6;--s2:#eb6834;--s3:#1baf7a;--sub:#52514e;--neg:#e34948;
    --good-ink:#006300;--critical:#d03b3b;--warning:#fab219;}
  @media (prefers-color-scheme:dark){:root:where(:not([data-theme="light"])) .viz-root{color-scheme:dark;
    --surface-1:#1a1a19;--plane:#0d0d0d;--text-primary:#fff;--text-secondary:#c3c2b7;--muted:#898781;
    --grid:#2c2c2a;--baseline:#383835;--border:rgba(255,255,255,.10);
    --s1:#3987e5;--s2:#d95926;--s3:#199e70;--sub:#c3c2b7;--neg:#e66767;--good-ink:#0ca30c;}}
  :root[data-theme="dark"] .viz-root{color-scheme:dark;
    --surface-1:#1a1a19;--plane:#0d0d0d;--text-primary:#fff;--text-secondary:#c3c2b7;--muted:#898781;
    --grid:#2c2c2a;--baseline:#383835;--border:rgba(255,255,255,.10);
    --s1:#3987e5;--s2:#d95926;--s3:#199e70;--sub:#c3c2b7;--neg:#e66767;--good-ink:#0ca30c;}
  .viz-root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--plane);
    color:var(--text-primary);padding:28px 20px 56px;margin:0;line-height:1.5}
  .wrap{max-width:1020px;margin:0 auto}
  h1{font-size:1.35rem;margin:0 0 4px;letter-spacing:-.01em}
  .sub{color:var(--text-secondary);font-size:.85rem;margin:0 0 24px}
  .card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
  h2{font-size:1rem;margin:0 0 4px}
  .note{color:var(--text-secondary);font-size:.8rem;margin:6px 0 0}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-bottom:16px}
  .tile{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:16px 18px}
  .tile .r{font-size:.78rem;color:var(--text-secondary);margin-bottom:6px}
  .tile .v{font-size:1.6rem;font-weight:600;letter-spacing:-.02em}
  .tile .s{font-size:.76rem;color:var(--muted);margin-top:4px}
  .tile.destaque{box-shadow:inset 3px 0 0 var(--s1)}
  .tile .v.good{color:var(--good-ink)}.tile .v.critical{color:var(--critical)}
  .alerts{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
  .alert{display:flex;gap:10px;align-items:flex-start;background:var(--surface-1);border:1px solid var(--border);
    border-left:3px solid var(--warning);border-radius:8px;padding:12px 14px;font-size:.85rem}
  .alert .ico{flex:none;font-weight:700}
  .chart{width:100%;height:auto;overflow:visible;margin-top:4px}
  .chartlabel{font-size:.78rem;color:var(--text-secondary);margin-top:14px}
  .chart .base{stroke:var(--baseline);stroke-width:1}
  .chart .grid80{stroke:var(--grid);stroke-width:1;stroke-dasharray:3 3}
  .chart .glabel{fill:var(--muted);font-size:10px}
  .chart .vlabel{fill:var(--text-primary);font-size:11px;font-weight:600;text-anchor:middle}
  .chart .vlabel.sm{font-size:9.5px}
  .chart .xlabel{fill:var(--muted);font-size:10px;text-anchor:middle}
  .chart .xlabel.rot{text-anchor:start;font-size:9.5px}
  .chart .hit{fill:transparent}
  .chart .col:hover .hit,.chart .col:focus-visible .hit{fill:color-mix(in srgb,var(--text-primary) 6%,transparent)}
  .chart g:focus-visible{outline:none}
  .legend{display:flex;flex-wrap:wrap;gap:16px;margin-top:12px;font-size:.78rem;color:var(--text-secondary)}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .sw{width:11px;height:11px;border-radius:3px;flex:none}
  table{width:100%;border-collapse:collapse;font-size:.8rem}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--grid)}
  th{color:var(--text-secondary);font-weight:600}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  td.neg{color:var(--neg);font-weight:600}
  .scroll{overflow-x:auto}
  details{margin-top:10px}summary{cursor:pointer;font-size:.85rem;color:var(--text-secondary)}
  .meth{font-size:.82rem;color:var(--text-secondary)}.meth li{margin-bottom:7px}
  .src{font-size:.74rem;color:var(--muted);margin-top:22px}
  .abcbadge{display:inline-block;width:18px;text-align:center;border-radius:3px;font-size:.7rem;font-weight:700;color:#fff}
</style>
<div class="viz-root"><div class="wrap">
  <h1>${esc(d.empresa)}</h1>
  <p class="sub">Auditoria de demonstrativos · ${esc(d.periodo.inicio)} a ${esc(d.periodo.fim)} · ${d.periodos_unidos.length} relatórios unidos · gerado em ${new Date(d.gerado_em).toLocaleString("pt-BR")}</p>

  <div class="tiles">${tiles.map((t) => `<div class="tile${t.destaque ? " destaque" : ""}">
    <div class="r">${esc(t.r)}</div><div class="v${t.estado ? " " + t.estado : ""}">${t.v}</div><div class="s">${esc(t.s)}</div></div>`).join("")}</div>

  ${d.alertas.length ? `<div class="alerts">${d.alertas.map((a) => `<div class="alert"><span class="ico" aria-hidden="true">!</span><div>${esc(a)}</div></div>`).join("")}</div>` : ""}

  <div class="card">
    <h2>Evolução mensal</h2>
    <p class="note">Receita e margem vêm das ${op.total_viagens.toLocaleString("pt-BR")} linhas de viagem, conferidas contra os totais impressos pelo ERP. Melhor mês: <strong>${mesLabel(op.melhor_mes.mes)}</strong> (${pct(op.melhor_mes.margem_pct)}) · pior: <strong>${mesLabel(op.pior_mes.mes)}</strong> (${pct(op.pior_mes.margem_pct)}).</p>
    ${serieMensal(d.mensal)}
    <div class="scroll"><table>
      <thead><tr><th>Mês</th><th class="n">Viagens</th><th class="n">Receita</th><th class="n">Margem</th><th class="n">Margem %</th><th class="n">Receita/viagem</th></tr></thead>
      <tbody>${d.mensal.map((m) => `<tr><td>${mesLabel(m.mes)}</td><td class="n">${m.viagens}</td><td class="n">${brlExato(m.receita)}</td><td class="n">${brlExato(m.margem)}</td><td class="n">${pct(m.margem_pct)}</td><td class="n">${brlExato(m.receita / m.viagens)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>

  <div class="card">
    <h2>Curva ABC — faturamento por cliente</h2>
    <p class="note">${d.abc_faturamento.resumo.map((r) => `<strong>Classe ${r.classe}</strong>: ${r.itens} cliente${r.itens > 1 ? "s" : ""} = ${pct(r.pct)}`).join(" · ")}</p>
    ${curvaABC(d.abc_faturamento.itens, { limite: 14, unidade: "Clientes" })}
    <div class="legend">
      <span><span class="sw" style="background:var(--s1)"></span>Classe A (até 80% acumulado)</span>
      <span><span class="sw" style="background:var(--s2)"></span>Classe B (80–95%)</span>
      <span><span class="sw" style="background:var(--s3)"></span>Classe C (últimos 5%)</span>
    </div>
    <details><summary>Ver os ${d.abc_faturamento.itens.length} clientes com margem</summary>
      <div class="scroll"><table>
        <thead><tr><th>Cliente</th><th>Classe</th><th class="n">Faturamento</th><th class="n">% acum.</th><th class="n">Viagens</th><th class="n">Margem</th><th class="n">Margem %</th></tr></thead>
        <tbody>${d.abc_faturamento.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.classe}</td><td class="n">${brlExato(i.valor)}</td><td class="n">${pct(i.pct_acumulado)}</td><td class="n">${i.viagens}</td><td class="n${i.margem < 0 ? " neg" : ""}">${brlExato(i.margem)}</td><td class="n${i.margem_pct < 0 ? " neg" : ""}">${pct(i.margem_pct)}</td></tr>`).join("")}</tbody>
      </table></div>
    </details>
  </div>

  ${negativos.length ? `<div class="card">
    <h2>Clientes com margem negativa</h2>
    <p class="note">${negativos.length} clientes deram prejuízo no período, somando <strong>${brlExato(prejuizoClientes)}</strong>. Frete cobrado abaixo do custo do motorista mais tributos.</p>
    <div class="scroll"><table>
      <thead><tr><th>Cliente</th><th class="n">Faturamento</th><th class="n">Viagens</th><th class="n">Margem</th><th class="n">Margem %</th></tr></thead>
      <tbody>${negativos.map((i) => `<tr><td>${esc(i.nome)}</td><td class="n">${brlExato(i.valor)}</td><td class="n">${i.viagens}</td><td class="n neg">${brlExato(i.margem)}</td><td class="n neg">${pct(i.margem_pct)}</td></tr>`).join("")}</tbody>
    </table></div>
  </div>` : ""}

  <div class="card">
    <h2>Curva ABC — despesas de estrutura</h2>
    <p class="note">Base: ${brlExato(d.abc_despesas.total)}. ${d.abc_despesas.resumo.map((r) => `<strong>Classe ${r.classe}</strong>: ${r.itens} itens = ${pct(r.pct)}`).join(" · ")}</p>
    ${curvaABC(d.abc_despesas.itens, { limite: 14, unidade: "Itens" })}
    <details><summary>Ver os ${d.abc_despesas.itens.length} itens de despesa de estrutura</summary>
      <div class="scroll"><table>
        <thead><tr><th>Item</th><th>Classe</th><th class="n">Valor</th><th class="n">%</th><th class="n">% acum.</th></tr></thead>
        <tbody>${d.abc_despesas.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.classe}</td><td class="n">${brlExato(i.valor)}</td><td class="n">${pct(i.pct)}</td><td class="n">${pct(i.pct_acumulado)}</td></tr>`).join("")}</tbody>
      </table></div>
    </details>
  </div>

  <div class="card">
    <h2>Metodologia</h2>
    <ul class="meth">
      <li><strong>Desconto concedido excluído.</strong> ${brlExato(dp.excluido_decisao)} saíram do total de despesas por decisão. Isso pressupõe que a receita de frete já vem líquida do desconto — se não vier, o resultado está superavaliado nesse valor.</li>
      <li><strong>${brlExato(dp.sobrepoe_frete)}</strong> (ICMS, pedágio, fretes, seguro do frete) já estão deduzidos dentro da margem de frete; excluídos para não contar duas vezes.</li>
      <li><strong>${brlExato(dp.nao_despesa)}</strong> são adiantamentos, empréstimos e estornos — saída de caixa, não despesa de resultado.</li>
      <li><strong>Série mensal só de receita e margem.</strong> O relatório de despesas filtra por data de pagamento mas imprime a data de emissão da nota, então não dá para cortá-lo por mês com honestidade. Para ABC mensal de despesas, é preciso um relatório por mês.</li>
      <li>Todos os números saem dos totais impressos pelo ERP ou de linhas de detalhe conferidas contra eles: ${op.total_viagens.toLocaleString("pt-BR")} viagens e a margem de ${brlExato(op.margem_frete)} fecham ao centavo.</li>
    </ul>
  </div>

  <p class="src">Fontes: ${d.arquivos_fonte.map(esc).join(" · ")}</p>
</div></div>`;

const saida = saidaArg ?? path.join("outputs", "dashboards", `consolidado_${Date.now()}.html`);
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html, "utf8");
console.log(saida);
