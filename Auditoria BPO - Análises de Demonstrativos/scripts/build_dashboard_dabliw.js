#!/usr/bin/env node
// Dashboard final no padrão de marca Dabliw ("Nocturne").
//
// Uso:
//   node build_dashboard_dabliw.js <consolidado.json> [saida.html]
//
// DECISÕES DE MARCA (do guia Dabliw)
// - "Sem acento colorido: a marca vive em preto, branco e na escala de cinza.
//   Contraste vem do peso tonal, não de saturação." Por isso os gráficos usam
//   a rampa cinza-azulada da marca, não uma paleta categórica colorida.
// - Isso é possível porque as séries aqui são ORDINAIS, não categóricas:
//   classe A > B > C tem ordem natural, e a rampa de um só tom é o encoding
//   correto para isso (validada com --ordinal contra a superfície #161826).
// - Tipografia Inter em um peso; caímos para system-ui onde Inter não estiver
//   instalada, já que a página é autocontida e não busca fonte externa.
// - Única exceção cromática: vermelho para valor negativo e faixa de alerta.
//   É sinal funcional (prejuízo não pode parecer lucro), não expressão de
//   marca — cinza sozinho não distingue perda de ganho.

import fs from "node:fs";
import path from "node:path";

const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlEx = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pc = (v) =>
  `${v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const mesLb = (m) => `${MES[+m.split("-")[1] - 1]}/${m.split("-")[0].slice(2)}`;

// Rampa ordinal da marca, clara→escura. Validada: L monotônica, ΔL ≥ 0.06,
// ponta clara 2.69:1 sobre #161826, hue spread 13°.
const RAMPA = ["#E9E9ED", "#B2B6CA", "#9397AB", "#595D6C"];

const [, , entrada, saidaArg] = process.argv;
if (!entrada) {
  console.error("uso: node build_dashboard_dabliw.js <consolidado.json> [saida.html]");
  process.exit(1);
}
const d = JSON.parse(fs.readFileSync(entrada, "utf8"));
const op = d.operacao_frete, dp = d.despesas_pagas, co = d.consolidado;

// --- Série mensal ---------------------------------------------------------
function serieMensal(mensal) {
  const L = 800, H = 210, pL = 12, pR = 12, pT = 22, pB = 30;
  const w = L - pL - pR, h = H - pT - pB;
  const max = Math.max(...mensal.map((m) => m.receita));
  const passo = w / mensal.length;
  const bw = Math.min(52, passo * 0.52);
  const barras = mensal.map((m, i) => {
    const cx = pL + passo * (i + 0.5);
    const bh = (m.receita / max) * h, y = pT + h - bh;
    return `<g class="it" tabindex="0" aria-label="${mesLb(m.mes)}: ${brlEx(m.receita)}, ${m.viagens} viagens, margem ${pc(m.margem_pct)}">
      <rect class="hit" x="${(cx - passo / 2).toFixed(1)}" y="${pT}" width="${passo.toFixed(1)}" height="${h}"/>
      <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="4" fill="${RAMPA[1]}"/>
      <text class="v sm" x="${cx.toFixed(1)}" y="${(y - 7).toFixed(1)}">${brl(m.receita)}</text>
      <text class="x" x="${cx.toFixed(1)}" y="${H - 10}">${mesLb(m.mes)}</text>
      <title>${mesLb(m.mes)} — ${brlEx(m.receita)} · ${m.viagens} viagens · margem ${pc(m.margem_pct)}</title></g>`;
  }).join("");

  const H2 = 150, h2 = H2 - pT - pB;
  const maxP = Math.max(...mensal.map((m) => m.margem_pct)) * 1.2;
  const pts = mensal.map((m, i) => ({
    x: pL + passo * (i + 0.5),
    y: pT + h2 - (m.margem_pct / maxP) * h2, m,
  }));
  return `<div class="cl">Receita de frete por mês</div>
  <svg viewBox="0 0 ${L} ${H}" role="img" class="ch">
    <line class="bl" x1="${pL}" y1="${pT + h}" x2="${L - pR}" y2="${pT + h}"/>${barras}</svg>
  <div class="cl">Margem de frete (%) por mês</div>
  <svg viewBox="0 0 ${L} ${H2}" role="img" class="ch">
    <line class="bl" x1="${pL}" y1="${pT + h2}" x2="${L - pR}" y2="${pT + h2}"/>
    <path d="${pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" fill="none" stroke="${RAMPA[0]}" stroke-width="2"/>
    ${pts.map((p) => `<g class="it" tabindex="0" aria-label="${mesLb(p.m.mes)}: margem ${pc(p.m.margem_pct)}">
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="${RAMPA[0]}" stroke="var(--bg2)" stroke-width="2"/>
      <text class="v sm" x="${p.x.toFixed(1)}" y="${(p.y - 12).toFixed(1)}">${pc(p.m.margem_pct)}</text>
      <text class="x" x="${p.x.toFixed(1)}" y="${H2 - 10}">${mesLb(p.m.mes)}</text>
      <title>${mesLb(p.m.mes)} — margem ${pc(p.m.margem_pct)}</title></g>`).join("")}
  </svg>`;
}

// --- Evolução mensal de despesas -------------------------------------------
// Rótulos dos grupos reais de despesa (exclui nao_despesa, sobrepoe_frete e
// excluido_decisao — que por definição não compõem "despesas de estrutura",
// ver analyze_reports.js). Ordem fixa por relevância típica, não por valor de
// um mês específico, para a pilha não trocar de ordem entre meses.
const ROTULO_GRUPO = {
  frota: "Frota e manutenção",
  administrativo: "Administrativo e estrutura",
  socios: "Sócios (pró-labore)",
  comercial: "Comercial (descontos e comissões)",
  financeiro: "Financeiro (juros e tarifas)",
  pessoal: "Pessoal (salários e encargos)",
  perdas: "Perdas operacionais",
  tributos_nao_frete: "Tributos não ligados ao frete",
};
const ORDEM_GRUPOS = Object.keys(ROTULO_GRUPO);

// Barras empilhadas por mês. Pilha usa a MESMA rampa tonal única da marca —
// os segmentos são categorias, não uma escala ordenada, então isso é a
// exceção deliberada: com 8 categorias não dá para diferenciá-las só por
// tom sem ambiguidade, mas aqui o gap de 2px entre segmentos (regra de marca
// dos specs) já basta para a pilha ler certo, e o detalhe por categoria vive
// no heatmap logo abaixo, que é onde essa leitura realmente importa.
function pilhaMensal(mensalDespesas) {
  const L = 800, H = 260, pL = 12, pR = 12, pT = 18, pB = 30;
  const w = L - pL - pR, h = H - pT - pB;
  const totais = mensalDespesas.map((m) => m.estrutura);
  const max = Math.max(...totais);
  const passo = w / mensalDespesas.length, bw = Math.min(64, passo * 0.6);
  const GAP = 2; // regra de marca: 2px de respiro entre segmentos empilhados

  const grupos = mensalDespesas.map((m, i) => {
    const cx = pL + passo * (i + 0.5);
    let yAcum = pT + h - (m.estrutura / max) * h;
    const alturaTotal = (m.estrutura / max) * h;
    let y = pT + h;
    const segs = ORDEM_GRUPOS.filter((g) => m.grupos[g] > 0)
      .map((g, si, arr) => {
        const valor = m.grupos[g];
        const segH = Math.max(1, (valor / max) * h - (arr.length > 1 ? GAP : 0));
        y -= segH + (si > 0 ? GAP : 0);
        const alpha = 0.35 + (0.55 * (ORDEM_GRUPOS.indexOf(g) / (ORDEM_GRUPOS.length - 1)));
        return `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${segH.toFixed(1)}" rx="2"
          fill="${RAMPA[1]}" fill-opacity="${alpha.toFixed(2)}">
          <title>${esc(ROTULO_GRUPO[g])} — ${mesLb(m.mes)}: ${brlEx(valor)}</title></rect>`;
      }).join("");
    return `<g class="it" tabindex="0" aria-label="${mesLb(m.mes)}: despesas de estrutura ${brlEx(m.estrutura)}">
      <rect class="hit" x="${(cx - passo / 2).toFixed(1)}" y="${pT}" width="${passo.toFixed(1)}" height="${h}"/>
      ${segs}
      <text class="v sm" x="${cx.toFixed(1)}" y="${(pT + h - alturaTotal - 7).toFixed(1)}">${brl(m.estrutura)}</text>
      <text class="x" x="${cx.toFixed(1)}" y="${H - 10}">${mesLb(m.mes)}</text>
      <title>${mesLb(m.mes)} — total ${brlEx(m.estrutura)}</title></g>`;
  }).join("");

  return `<svg viewBox="0 0 ${L} ${H}" role="img" class="ch">
    <line class="bl" x1="${pL}" y1="${pT + h}" x2="${L - pR}" y2="${pT + h}"/>${grupos}</svg>`;
}

// Heatmap grupo × mês: intensidade em opacidade de um tom só (sequencial de
// verdade — a rampa da marca já foi validada como ordinal, e magnitude por
// célula é exatamente esse caso de uso, mais legível que 8 tons de pilha).
function heatmapGrupos(mensalDespesas) {
  // Só entre os grupos REALMENTE exibidos (ORDEM_GRUPOS) — m.grupos também
  // carrega excluido_decisao/sobrepoe_frete/nao_despesa, que não aparecem
  // nesta tabela. Calibrar a escala contra um valor invisível deixaria as
  // células visíveis sub-saturadas, sem relação com o que se vê na tela.
  const maxCelula = Math.max(
    ...mensalDespesas.flatMap((m) =>
      ORDEM_GRUPOS.map((g) => m.grupos[g] ?? 0),
    ),
  );
  const linhas = ORDEM_GRUPOS.map((g) => {
    const total = mensalDespesas.reduce((a, m) => a + (m.grupos[g] ?? 0), 0);
    if (total <= 0) return "";
    const celulas = mensalDespesas.map((m) => {
      const v = m.grupos[g] ?? 0;
      // Teto em 0.55: acima disso o texto claro perde contraste (checado
      // contra --tx sobre a superfície do card — 0.55 ainda fecha 4.6:1,
      // 0.6 já cai pra 4.1). Sem o teto, exatamente as células mais
      // relevantes — as de maior valor — ficariam as mais difíceis de ler.
      const alpha = v > 0 ? 0.14 + 0.41 * (v / maxCelula) : 0;
      return `<td class="hm n" style="background:${v > 0 ? `${RAMPA[1]}${Math.round(alpha * 255).toString(16).padStart(2, "0")}` : "transparent"}">${v > 0 ? brl(v) : "—"}</td>`;
    }).join("");
    return `<tr><td>${esc(ROTULO_GRUPO[g])}</td>${celulas}<td class="n" style="font-weight:600">${brlEx(total)}</td></tr>`;
  }).join("");

  return `<div class="scroll"><table>
    <thead><tr><th>Grupo</th>${mensalDespesas.map((m) => `<th class="n">${mesLb(m.mes)}</th>`).join("")}<th class="n">Total</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table></div>`;
}

// --- Curva ABC ------------------------------------------------------------
const COR_ABC = { A: RAMPA[0], B: RAMPA[1], C: RAMPA[3] };
function abc(itens, limite = 12) {
  const m = itens.slice(0, limite);
  const L = 800, H = 250, pL = 10, pR = 40, pT = 20, pB = 76;
  const w = L - pL - pR, h = H - pT - pB;
  const max = Math.max(...m.map((i) => i.valor));
  const passo = w / m.length, bw = Math.min(38, passo * 0.58);
  const barras = m.map((it, i) => {
    const cx = pL + passo * (i + 0.5);
    const bh = Math.max(2, (it.valor / max) * h), y = pT + h - bh;
    const nm = it.nome.length > 19 ? it.nome.slice(0, 18) + "…" : it.nome;
    return `<g class="it" tabindex="0" aria-label="${esc(it.nome)}: ${brlEx(it.valor)}, classe ${it.classe}, acumulado ${pc(it.pct_acumulado)}">
      <rect class="hit" x="${(cx - passo / 2).toFixed(1)}" y="${pT}" width="${passo.toFixed(1)}" height="${h}"/>
      <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${COR_ABC[it.classe]}"/>
      <text class="x rot" transform="translate(${cx.toFixed(1)},${pT + h + 9}) rotate(38)">${esc(nm)}</text>
      <title>${esc(it.nome)} — ${brlEx(it.valor)} (${pc(it.pct)}) · classe ${it.classe} · acumulado ${pc(it.pct_acumulado)}</title></g>`;
  }).join("");
  const linha = m.map((it, i) => {
    const cx = pL + passo * (i + 0.5);
    return `${i ? "L" : "M"}${cx.toFixed(1)},${(pT + h - (it.pct_acumulado / 100) * h).toFixed(1)}`;
  }).join(" ");
  const y80 = pT + h - 0.8 * h;
  return `<svg viewBox="0 0 ${L} ${H}" role="img" class="ch">
    <line class="g80" x1="${pL}" y1="${y80.toFixed(1)}" x2="${L - pR}" y2="${y80.toFixed(1)}"/>
    <text class="gl" x="${L - pR + 5}" y="${(y80 + 4).toFixed(1)}">80%</text>
    <line class="bl" x1="${pL}" y1="${pT + h}" x2="${L - pR}" y2="${pT + h}"/>${barras}
    <path d="${linha}" fill="none" stroke="${RAMPA[2]}" stroke-width="1.5" stroke-dasharray="4 3"/>
  </svg>`;
}

const tiles = [
  { r: "Receita de frete", v: brl(op.receita_frete), s: `${op.total_viagens.toLocaleString("pt-BR")} viagens · ${op.clientes_distintos} clientes` },
  { r: "Margem de frete", v: brl(op.margem_frete), s: `${pc(op.margem_pct)} da receita` },
  { r: "Outras receitas", v: brl(co.outras_receitas ?? 0), s: "sem a receita de frete" },
  { r: "Resultado", v: brl(co.resultado), s: `${pc(co.margem_liquida_pct)} da receita`, neg: co.resultado < 0 },
];

const html = `<title>DABLIW · Auditoria de Demonstrativos — ${esc(d.empresa)}</title>
<style>
  :root{color-scheme:dark}
  .db{--bg:#0F111A;--bg2:#161826;--bg3:#232532;--ln:#3F424D;
    --tx:#F3F5FE;--tx2:#B2B6CA;--tx3:#9397AB;--neg:#E06C6C;--warn:#B2B6CA;
    font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
    background:var(--bg);color:var(--tx);margin:0;padding:0 0 64px;line-height:1.55;
    -webkit-font-smoothing:antialiased}
  .wrap{max-width:1000px;margin:0 auto;padding:0 22px}
  .top{border-bottom:1px solid var(--ln);background:var(--bg2);padding:20px 0;margin-bottom:32px}
  .lock{display:flex;align-items:center;gap:12px}
  .badge{width:34px;height:34px;border:1.5px solid var(--tx);border-radius:50%;display:flex;
    align-items:center;justify-content:center;font-size:.58rem;letter-spacing:.06em;font-weight:500;flex:none}
  .wm{font-size:1.32rem;font-weight:500;letter-spacing:-.02em}
  .tag{font-size:.62rem;color:var(--tx3);letter-spacing:.14em;text-transform:uppercase;margin-top:1px}
  h1{font-size:1.5rem;font-weight:500;margin:0 0 6px;letter-spacing:-.02em}
  .sub{color:var(--tx3);font-size:.83rem;margin:0 0 26px}
  .kicker{font-size:.66rem;letter-spacing:.15em;text-transform:uppercase;color:var(--tx3);margin-bottom:6px}
  .card{background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:22px;margin-bottom:16px}
  h2{font-size:.95rem;font-weight:500;margin:0 0 4px;letter-spacing:-.01em}
  .note{color:var(--tx3);font-size:.79rem;margin:5px 0 0}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(196px,1fr));gap:12px;margin-bottom:18px}
  .tile{background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:16px 18px}
  .tile .r{font-size:.7rem;color:var(--tx3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px}
  .tile .v{font-size:1.62rem;font-weight:500;letter-spacing:-.025em}
  .tile .v.neg{color:var(--neg)}
  .tile .s{font-size:.74rem;color:var(--tx3);margin-top:3px}
  .alerts{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
  .al{display:flex;gap:11px;background:var(--bg2);border:1px solid var(--ln);border-left:2px solid var(--tx2);
    border-radius:8px;padding:11px 14px;font-size:.81rem;color:var(--tx2)}
  .al .i{flex:none;font-weight:600;color:var(--tx)}
  .al.hard{border-left-color:var(--neg)}
  .ch{width:100%;height:auto;overflow:visible;margin-top:6px}
  .cl{font-size:.72rem;color:var(--tx3);letter-spacing:.08em;text-transform:uppercase;margin-top:16px}
  .ch .bl{stroke:var(--ln);stroke-width:1}
  .ch .g80{stroke:var(--ln);stroke-width:1;stroke-dasharray:3 3}
  .ch .gl{fill:var(--tx3);font-size:10px}
  .ch .v{fill:var(--tx);font-size:11px;font-weight:500;text-anchor:middle}
  .ch .v.sm{font-size:9.5px;fill:var(--tx2)}
  .ch .x{fill:var(--tx3);font-size:9.5px;text-anchor:middle}
  .ch .x.rot{text-anchor:start;font-size:9px}
  .ch .hit{fill:transparent}
  .ch .it:hover .hit,.ch .it:focus-visible .hit{fill:rgba(255,255,255,.05)}
  .ch .it:focus-visible{outline:none}
  .lg{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px;font-size:.75rem;color:var(--tx3)}
  .lg span{display:inline-flex;align-items:center;gap:6px}
  .sw{width:10px;height:10px;border-radius:2px;flex:none}
  table{width:100%;border-collapse:collapse;font-size:.78rem}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--ln)}
  th{color:var(--tx3);font-weight:500;font-size:.72rem;letter-spacing:.05em;text-transform:uppercase}
  td{color:var(--tx2)}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  td.neg{color:var(--neg)}
  td.hm{color:var(--tx);font-variant-numeric:tabular-nums}
  .scroll{overflow-x:auto}
  details{margin-top:12px}
  summary{cursor:pointer;font-size:.79rem;color:var(--tx3)}
  .meth{font-size:.81rem;color:var(--tx2);padding-left:18px}
  .meth li{margin-bottom:8px}
  .foot{border-top:1px solid var(--ln);margin-top:30px;padding-top:18px;font-size:.72rem;color:var(--tx3);
    display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
</style>
<div class="db">
  <div class="top"><div class="wrap"><div class="lock">
    <div class="badge">BPO</div>
    <div><div class="wm">DABLIW.</div><div class="tag">Business Process Outsourcing</div></div>
  </div></div></div>

  <div class="wrap">
    <div class="kicker">Auditoria de demonstrativos</div>
    <h1>${esc(d.empresa)}</h1>
    <p class="sub">${esc(d.periodo.inicio)} a ${esc(d.periodo.fim)} · ${d.periodos_unidos.length} períodos · emitido em ${new Date(d.gerado_em).toLocaleDateString("pt-BR")}</p>

    <div class="tiles">${tiles.map((t) => `<div class="tile"><div class="r">${esc(t.r)}</div>
      <div class="v${t.neg ? " neg" : ""}">${t.v}</div><div class="s">${esc(t.s)}</div></div>`).join("")}</div>

    ${d.alertas.length ? `<div class="alerts">${d.alertas.map((a) => {
      const hard = /NÃO reconcilia|negativo|superavaliado/i.test(a);
      return `<div class="al${hard ? " hard" : ""}"><span class="i" aria-hidden="true">!</span><div>${esc(a)}</div></div>`;
    }).join("")}</div>` : ""}

    <div class="card">
      <h2>Evolução mensal</h2>
      <p class="note">Receita e margem apuradas nas ${op.total_viagens.toLocaleString("pt-BR")} viagens individuais, conferidas contra os totais impressos pelo ERP. Melhor mês: <strong>${mesLb(op.melhor_mes.mes)}</strong> (${pc(op.melhor_mes.margem_pct)}) · pior: <strong>${mesLb(op.pior_mes.mes)}</strong> (${pc(op.pior_mes.margem_pct)}).</p>
      ${serieMensal(d.mensal)}
      <div class="scroll"><table>
        <thead><tr><th>Mês</th><th class="n">Viagens</th><th class="n">Receita</th><th class="n">Margem</th><th class="n">Margem %</th><th class="n">Receita/viagem</th></tr></thead>
        <tbody>${d.mensal.map((m) => `<tr><td>${mesLb(m.mes)}</td><td class="n">${m.viagens}</td><td class="n">${brlEx(m.receita)}</td><td class="n">${brlEx(m.margem)}</td><td class="n">${pc(m.margem_pct)}</td><td class="n">${brlEx(m.receita / m.viagens)}</td></tr>`).join("")}</tbody>
      </table></div>
    </div>

    ${d.mensal_despesas?.length ? `<div class="card">
      <h2>Evolução mensal de despesas</h2>
      <p class="note">Despesas de estrutura por mês pago — só é honesto porque cada relatório de origem já é um mês fechado (o ERP filtra por data de pagamento; num relatório semestral cada lançamento só traz a data de emissão da nota, que responde outra pergunta). Exclui desconto concedido, itens que já entram na margem de frete e o que não é despesa de resultado.</p>
      ${pilhaMensal(d.mensal_despesas)}
      <p class="cl" style="margin-top:14px">Detalhe por grupo — intensidade proporcional ao valor da célula</p>
      ${heatmapGrupos(d.mensal_despesas)}
    </div>` : ""}

    <div class="card">
      <h2>Curva ABC — faturamento por cliente</h2>
      <p class="note">${d.abc_faturamento.resumo.map((r) => `<strong>Classe ${r.classe}</strong>: ${r.itens} cliente${r.itens > 1 ? "s" : ""} = ${pc(r.pct)}`).join(" · ")}</p>
      ${abc(d.abc_faturamento.itens)}
      <div class="lg">
        <span><span class="sw" style="background:${COR_ABC.A}"></span>Classe A — até 80% acumulado</span>
        <span><span class="sw" style="background:${COR_ABC.B}"></span>Classe B — 80 a 95%</span>
        <span><span class="sw" style="background:${COR_ABC.C}"></span>Classe C — últimos 5%</span>
      </div>
      <details><summary>Ver os ${d.abc_faturamento.itens.length} clientes com margem</summary>
        <div class="scroll"><table>
          <thead><tr><th>Cliente</th><th>Classe</th><th class="n">Faturamento</th><th class="n">% acum.</th><th class="n">Viagens</th><th class="n">Margem</th><th class="n">Margem %</th></tr></thead>
          <tbody>${d.abc_faturamento.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.classe}</td><td class="n">${brlEx(i.valor)}</td><td class="n">${pc(i.pct_acumulado)}</td><td class="n">${i.viagens}</td><td class="n${i.margem < 0 ? " neg" : ""}">${brlEx(i.margem)}</td><td class="n${i.margem_pct < 0 ? " neg" : ""}">${pc(i.margem_pct)}</td></tr>`).join("")}</tbody>
        </table></div>
      </details>
    </div>

    <div class="card">
      <h2>Curva ABC — despesas de estrutura</h2>
      <p class="note">Base ${brlEx(d.abc_despesas.total)}. ${d.abc_despesas.resumo.map((r) => `<strong>Classe ${r.classe}</strong>: ${r.itens} itens = ${pc(r.pct)}`).join(" · ")}</p>
      ${abc(d.abc_despesas.itens)}
      <details><summary>Ver os ${d.abc_despesas.itens.length} itens</summary>
        <div class="scroll"><table>
          <thead><tr><th>Item</th><th>Classe</th><th class="n">Valor</th><th class="n">%</th><th class="n">% acum.</th></tr></thead>
          <tbody>${d.abc_despesas.itens.map((i) => `<tr><td>${esc(i.nome)}</td><td>${i.classe}</td><td class="n">${brlEx(i.valor)}</td><td class="n">${pc(i.pct)}</td><td class="n">${pc(i.pct_acumulado)}</td></tr>`).join("")}</tbody>
        </table></div>
      </details>
    </div>

    <div class="card">
      <h2>Metodologia e critérios</h2>
      <ul class="meth">
        <li><strong>Receita de frete</strong> apurada viagem a viagem no relatório de lucratividade; contagem e margem conferem ao centavo com os totais do ERP.</li>
        <li><strong>Outras receitas (${brlEx(co.outras_receitas ?? 0)})</strong> vêm do relatório de receitas gerais <em>sem</em> o grupo Receita Operacional, que é o frete já apurado acima — incluí-lo contaria a receita duas vezes.</li>
        <li><strong>Desconto concedido (${brlEx(dp.excluido_decisao ?? 0)})</strong> excluído do total de despesas por decisão, por ser redutor de receita e não custo de estrutura.</li>
        <li><strong>${brlEx(dp.sobrepoe_frete)}</strong> de ICMS, pedágio, fretes e seguro do frete já estão deduzidos dentro da margem; excluídos para não duplicar.</li>
        <li><strong>${brlEx(dp.nao_despesa)}</strong> de adiantamentos, empréstimos e estornos são movimentação de caixa, não despesa de resultado.</li>
        <li>Clientes de margem acumulada negativa são removidos do relatório${d.clientes_excluidos?.quantidade ? ` (${d.clientes_excluidos.quantidade} no período)` : " — nenhum no período"}.</li>
      </ul>
    </div>

    <div class="foot">
      <div><strong style="color:var(--tx2)">DABLIW.</strong> · Business Process Outsourcing<br>Auditoria de demonstrativos · documento gerado automaticamente a partir dos relatórios do ERP.</div>
      <div style="text-align:right">Fontes:<br>${d.arquivos_fonte.slice(0, 3).map(esc).join("<br>")}${d.arquivos_fonte.length > 3 ? `<br>e mais ${d.arquivos_fonte.length - 3} arquivos` : ""}</div>
    </div>
  </div>
</div>`;

const saida = saidaArg ?? path.join("outputs", "dashboards", `dabliw_${Date.now()}.html`);
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html, "utf8");
console.log(saida);
