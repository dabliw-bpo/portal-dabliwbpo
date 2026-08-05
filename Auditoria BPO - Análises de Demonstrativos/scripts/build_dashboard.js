#!/usr/bin/env node
// Gera o dashboard HTML autocontido a partir do JSON de métricas.
//
// Uso:
//   node build_dashboard.js <metrics.json> [saida.html]
//
// O HTML não tem dependência externa (CSS/JS inline) e suporta tema claro e
// escuro. Paleta validada com o validador da skill dataviz: categórica de 3
// classes (slots 1/2/3) e par divergente azul↔vermelho, ambos aprovados em
// all-pairs nos dois modos. O aqua em modo claro fica abaixo de 3:1 contra a
// superfície, então a "regra de alívio" se aplica — todo valor tem rótulo
// direto e existe a tabela completa dos 57 itens.

import fs from "node:fs";
import path from "node:path";

const brl = (v) =>
  v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const brlExato = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (v) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
// Percentuais das barras de grupo: uma casa, para a coluna ficar alinhada.
const pct1 = (v) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Classe de tratamento -> slot categórico validado.
const CLASSE = {
  excluido_patrimonial: { slot: "s3", rotulo: "Não é despesa (patrimonial)" },
  excluido_dupla: { slot: "s2", rotulo: "Excluído — dupla contagem" },
  despesa: { slot: "s1", rotulo: "Despesa de estrutura (entra no resultado)" },
};
const classeDoGrupo = (g) =>
  g === "nao_despesa"
    ? "excluido_patrimonial"
    : g === "sobrepoe_frete"
      ? "excluido_dupla"
      : "despesa";

// --- Gráfico de colunas (usado nos dois blocos da reconciliação) -----------
// passos: [{ rotulo, valor, tipo: 'total'|'baixa'|'subtotal' }]
function colunas(passos, { largura = 560, altura = 300 } = {}) {
  const padL = 8;
  const padB = 58;
  const padT = 26;
  const h = altura - padB - padT;
  const max = Math.max(...passos.map((p) => Math.abs(p.valor)));
  const lb = (largura - padL * 2) / passos.length;
  const bw = Math.min(76, lb * 0.56);

  const barras = passos
    .map((p, i) => {
      const cx = padL + lb * i + lb / 2;
      const bh = Math.max(2, (Math.abs(p.valor) / max) * h);
      const y = padT + h - bh;
      const cor =
        p.tipo === "baixa" ? "var(--neg)" : p.tipo === "subtotal" ? "var(--sub)" : "var(--pos)";
      return `
      <g class="col" tabindex="0" aria-label="${esc(p.rotulo)}: ${brlExato(p.valor)}">
        <rect class="hit" x="${(cx - lb / 2).toFixed(1)}" y="${padT}" width="${lb.toFixed(1)}" height="${h}"></rect>
        <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${cor}"></rect>
        <text class="vlabel" x="${cx.toFixed(1)}" y="${(y - 8).toFixed(1)}">${p.tipo === "baixa" ? "−" : ""}${brl(Math.abs(p.valor))}</text>
        <text class="xlabel" x="${cx.toFixed(1)}" y="${altura - padB + 18}">${esc(p.rotulo)}</text>
        <title>${esc(p.rotulo)}: ${brlExato(p.valor)}</title>
      </g>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${largura} ${altura}" role="img" class="chart">
    <line class="base" x1="${padL}" y1="${padT + h}" x2="${largura - padL}" y2="${padT + h}"></line>
    ${barras}
  </svg>`;
}

// --- Barras horizontais dos grupos de despesa -----------------------------
function barrasGrupos(grupos, total) {
  const rotuloL = 250;
  const largura = 720;
  const linha = 34;
  const altura = grupos.length * linha + 12;
  const trilha = largura - rotuloL - 132;
  const max = Math.max(...grupos.map((g) => g.total));

  const linhas = grupos
    .map((g, i) => {
      const y = i * linha + 6;
      const w = Math.max(2, (g.total / max) * trilha);
      const cls = classeDoGrupo(g.grupo);
      return `
      <g class="row" tabindex="0" aria-label="${esc(g.rotulo)}: ${brlExato(g.total)}, ${pct(g.pct_do_relatorio)} do relatório">
        <rect class="hit" x="0" y="${y - 4}" width="${largura}" height="${linha - 2}"></rect>
        <text class="rlabel" x="0" y="${y + 15}">${esc(g.rotulo)}</text>
        <rect x="${rotuloL}" y="${y + 4}" width="${w.toFixed(1)}" height="15" rx="4" fill="var(--${CLASSE[cls].slot})"></rect>
        <text class="rvalue" x="${(rotuloL + w + 10).toFixed(1)}" y="${y + 16}">${brl(g.total)} · ${pct1(g.pct_do_relatorio)}</text>
        <title>${esc(g.rotulo)}: ${brlExato(g.total)} (${pct(g.pct_do_relatorio)})</title>
      </g>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${largura} ${altura}" role="img" class="chart">${linhas}</svg>`;
}

// --------------------------------------------------------------------------
const [, , metricsPath, saidaArg] = process.argv;
if (!metricsPath) {
  console.error("uso: node build_dashboard.js <metrics.json> [saida.html]");
  process.exit(1);
}
const m = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
const op = m.operacao_frete;
const dp = m.despesas_pagas;
const co = m.consolidado;

const tiles = [
  { r: "Receita de frete", v: brl(op.total_receitas), s: `${op.total_viagens.toLocaleString("pt-BR")} viagens · ${op.clientes_atendidos} clientes` },
  { r: "Margem de frete", v: brl(op.margem_frete), s: `${pct(op.margem_pct_sobre_receita)} da receita`, destaque: true },
  { r: "Despesas de estrutura", v: brl(dp.despesas_estrutura), s: `de ${brl(dp.total_relatorio)} pagos no período` },
  {
    r: "Resultado consolidado",
    v: brl(co.resultado),
    s: `${pct(co.margem_liquida_pct)} da receita`,
    estado: co.resultado >= 0 ? "good" : "critical",
  },
];

const html = `<title>Auditoria BPO — ${esc(m.empresa)} — ${esc(m.periodo.inicio)} a ${esc(m.periodo.fim)}</title>
<style>
  .viz-root{
    color-scheme:light;
    --surface-1:#fcfcfb; --plane:#f9f9f7;
    --text-primary:#0b0b0b; --text-secondary:#52514e; --muted:#898781;
    --grid:#e1e0d9; --baseline:#c3c2b7; --border:rgba(11,11,11,.10);
    --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a;
    --pos:#2a78d6; --neg:#e34948; --sub:#52514e;
    --good:#0ca30c; --warning:#fab219; --critical:#d03b3b;
    --good-ink:#006300;
  }
  @media (prefers-color-scheme:dark){
    :root:where(:not([data-theme="light"])) .viz-root{
      color-scheme:dark;
      --surface-1:#1a1a19; --plane:#0d0d0d;
      --text-primary:#fff; --text-secondary:#c3c2b7; --muted:#898781;
      --grid:#2c2c2a; --baseline:#383835; --border:rgba(255,255,255,.10);
      --s1:#3987e5; --s2:#d95926; --s3:#199e70;
      --pos:#3987e5; --neg:#e66767; --sub:#c3c2b7;
      --good-ink:#0ca30c;
    }
  }
  :root[data-theme="dark"] .viz-root{
    color-scheme:dark;
    --surface-1:#1a1a19; --plane:#0d0d0d;
    --text-primary:#fff; --text-secondary:#c3c2b7; --muted:#898781;
    --grid:#2c2c2a; --baseline:#383835; --border:rgba(255,255,255,.10);
    --s1:#3987e5; --s2:#d95926; --s3:#199e70;
    --pos:#3987e5; --neg:#e66767; --sub:#c3c2b7;
    --good-ink:#0ca30c;
  }
  .viz-root{
    font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
    background:var(--plane); color:var(--text-primary);
    padding:28px 20px 56px; margin:0; line-height:1.5;
  }
  .wrap{max-width:1020px;margin:0 auto}
  h1{font-size:1.35rem;margin:0 0 4px;letter-spacing:-.01em}
  .sub{color:var(--text-secondary);font-size:.85rem;margin:0 0 24px}
  .card{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px}
  h2{font-size:1rem;margin:0 0 4px}
  .note{color:var(--text-secondary);font-size:.82rem;margin:0 0 18px}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-bottom:16px}
  .tile{background:var(--surface-1);border:1px solid var(--border);border-radius:12px;padding:16px 18px}
  .tile .r{font-size:.78rem;color:var(--text-secondary);margin-bottom:6px}
  .tile .v{font-size:1.6rem;font-weight:600;letter-spacing:-.02em}
  .tile .s{font-size:.76rem;color:var(--muted);margin-top:4px}
  .tile.destaque{box-shadow:inset 3px 0 0 var(--s1)}
  .tile .v.good{color:var(--good-ink)} .tile .v.critical{color:var(--critical)}
  .alerts{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
  .alert{display:flex;gap:10px;align-items:flex-start;background:var(--surface-1);
    border:1px solid var(--border);border-left:3px solid var(--warning);
    border-radius:8px;padding:12px 14px;font-size:.85rem}
  .alert .ico{flex:none;font-weight:700;color:var(--text-primary)}
  .alert .lbl{font-weight:600;margin-right:4px}
  .charts{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media (max-width:760px){.charts{grid-template-columns:1fr}}
  .chart{width:100%;height:auto;overflow:visible}
  .chart .base{stroke:var(--baseline);stroke-width:1}
  .chart .vlabel{fill:var(--text-primary);font-size:11.5px;font-weight:600;text-anchor:middle}
  .chart .xlabel{fill:var(--muted);font-size:10.5px;text-anchor:middle}
  .chart .rlabel{fill:var(--text-primary);font-size:11.5px}
  .chart .rvalue{fill:var(--text-secondary);font-size:11px;font-variant-numeric:tabular-nums}
  .chart .hit{fill:transparent}
  .chart .col,.chart .row{cursor:default}
  .chart .col:hover .hit,.chart .row:hover .hit,
  .chart .col:focus-visible .hit,.chart .row:focus-visible .hit{fill:color-mix(in srgb,var(--text-primary) 6%,transparent)}
  .chart g:focus-visible{outline:none}
  .legend{display:flex;flex-wrap:wrap;gap:16px;margin:14px 0 0;font-size:.78rem;color:var(--text-secondary)}
  .legend span{display:inline-flex;align-items:center;gap:6px}
  .sw{width:11px;height:11px;border-radius:3px;flex:none}
  table{width:100%;border-collapse:collapse;font-size:.8rem}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--grid)}
  th{color:var(--text-secondary);font-weight:600}
  td.n{text-align:right;font-variant-numeric:tabular-nums}
  .scroll{overflow-x:auto}
  details{margin-top:8px} summary{cursor:pointer;font-size:.85rem;color:var(--text-secondary)}
  .meth{font-size:.82rem;color:var(--text-secondary)}
  .meth li{margin-bottom:7px}
  .src{font-size:.74rem;color:var(--muted);margin-top:22px}
</style>

<div class="viz-root"><div class="wrap">
  <h1>${esc(m.empresa)}</h1>
  <p class="sub">Auditoria de demonstrativos · ${esc(m.periodo.inicio)} a ${esc(m.periodo.fim)} · gerado em ${new Date(m.gerado_em).toLocaleString("pt-BR")}</p>

  <div class="tiles">
    ${tiles
      .map(
        (t) => `<div class="tile${t.destaque ? " destaque" : ""}">
      <div class="r">${esc(t.r)}</div>
      <div class="v${t.estado ? " " + t.estado : ""}">${t.v}</div>
      <div class="s">${esc(t.s)}</div>
    </div>`,
      )
      .join("")}
  </div>

  ${
    m.alertas.length
      ? `<div class="alerts">${m.alertas
          .map(
            (a) =>
              `<div class="alert"><span class="ico" aria-hidden="true">!</span><div><span class="lbl">Atenção:</span>${esc(a)}</div></div>`,
          )
          .join("")}</div>`
      : ""
  }

  <div class="charts">
    <div class="card">
      <h2>Operação de frete</h2>
      <p class="note">Competência: viagens emitidas no período. A margem é o que sobra depois do frete do motorista, ICMS e pedágio.</p>
      ${colunas([
        { rotulo: "Receita de frete", valor: op.total_receitas, tipo: "total" },
        { rotulo: "Custos de viagem", valor: op.total_custos, tipo: "baixa" },
        { rotulo: "Margem de frete", valor: op.margem_frete, tipo: "subtotal" },
      ])}
    </div>
    <div class="card">
      <h2>Da margem ao resultado</h2>
      <p class="note">Zoom na cauda do gráfico ao lado — escala própria, porque a margem é 10% da receita e não seria legível na mesma escala.</p>
      ${colunas([
        { rotulo: "Margem de frete", valor: op.margem_frete, tipo: "total" },
        { rotulo: "Despesas de estrutura", valor: dp.despesas_estrutura, tipo: "baixa" },
        { rotulo: "Resultado", valor: co.resultado, tipo: "subtotal" },
      ])}
    </div>
  </div>

  <div class="card">
    <h2>Composição das despesas pagas</h2>
    <p class="note">Os ${dp.quantidade_itens} itens do relatório de despesas pagas (${brlExato(dp.total_relatorio)}), agrupados. Só o azul entra no resultado — ver metodologia abaixo.</p>
    ${barrasGrupos(dp.grupos, dp.total_relatorio)}
    <div class="legend">
      ${Object.values(CLASSE)
        .map(
          (c) =>
            `<span><span class="sw" style="background:var(--${c.slot})"></span>${esc(c.rotulo)}</span>`,
        )
        .join("")}
    </div>
  </div>

  <div class="card">
    <h2>Metodologia</h2>
    <ul class="meth">
      <li><strong>Os dois relatórios não são somáveis.</strong> A lucratividade é por competência (viagem emitida); as despesas pagas são caixa. Somar os dois totais contaria ICMS e pedágio duas vezes.</li>
      <li><strong>${brlExato(dp.sobrepoe_frete)}</strong> das despesas pagas (ICMS, pedágio, fretes a pagar, seguro do frete) já estão deduzidos dentro da margem de frete — excluídos aqui para não contar em dobro.</li>
      <li><strong>${brlExato(dp.nao_despesa)}</strong> são adiantamentos, empréstimos a terceiros e estornos: saem do caixa, mas não são despesa de resultado. Excluídos do resultado e sinalizados como item de auditoria.</li>
      <li>Todos os números vêm dos <em>totais impressos pelo próprio ERP</em>, não de re-soma das linhas de detalhe. As duas conferências internas fecharam ao centavo: as parcelas de receita somam o Total Receitas, e os ${dp.quantidade_itens} itens somam o Total Geral.</li>
    </ul>
    <details>
      <summary>Ver os ${dp.quantidade_itens} itens de despesa detalhados</summary>
      <div class="scroll"><table>
        <thead><tr><th>Item</th><th>Cód.</th><th>Tratamento</th><th class="n">Valor</th><th class="n">% do relatório</th></tr></thead>
        <tbody>
        ${dp.grupos
          .flatMap((g) =>
            g.itens.map(
              (i) =>
                `<tr><td>${esc(i.item)}</td><td class="n">${i.codigo}</td><td>${esc(CLASSE[classeDoGrupo(g.grupo)].rotulo)}</td><td class="n">${brlExato(i.valor)}</td><td class="n">${pct((i.valor / dp.total_relatorio) * 100)}</td></tr>`,
            ),
          )
          .join("")}
        </tbody>
        <tfoot><tr><th>Total Geral</th><th></th><th></th><th class="n">${brlExato(dp.total_relatorio)}</th><th class="n">100%</th></tr></tfoot>
      </table></div>
    </details>
  </div>

  <p class="src">Fontes: ${m.arquivos_fonte.map(esc).join(" · ")}</p>
</div></div>`;

const saida =
  saidaArg ??
  path.join(
    "outputs",
    "dashboards",
    `dashboard_${new Date().toISOString().slice(0, 10)}.html`,
  );
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html, "utf8");
console.log(saida);
