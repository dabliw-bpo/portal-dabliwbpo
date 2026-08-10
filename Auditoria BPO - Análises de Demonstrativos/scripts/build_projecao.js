#!/usr/bin/env node
// Projeção de resultado ago-dez/2026 para a EGM Transportes.
//
// PONTO DE PARTIDA: os valores jan-jul abaixo são os que o usuário colou de
// dentro da própria planilha (aba DASHBOARD), depois de ele reclassificar a
// coluna "Despesas" para "Despesas/Empréstimos" — ou seja, incluindo de volta
// o grupo que eu havia separado como "não é despesa" (adiantamentos,
// empréstimos, estornos). Não uso os valores do meu JSON original aqui:
// uso exatamente o que está na planilha do usuário, porque foi isso que ele
// pediu ("utilizando as informações acima").
//
// PREMISSA DA PROJEÇÃO (pedida explicitamente): outras receitas = 0 de
// ago a dez. Isso importa muito: nos 7 meses reais, R$442.926,92 de outras
// receitas levaram o resultado acumulado de -R$222.299,35 para +R$220.627,57.
// Sem elas, jan-jul fecha NEGATIVO — é esse buraco que a projeção precisa
// mostrar como (ou se) se recupera.
//
// METODOLOGIA: tentei regressão linear sobre as despesas primeiro e descartei
// — a queda de jan/fev (R$398k/R$410k, inflados por adiantamentos pontuais)
// para maio (R$85k) é tão acentuada que a reta projeta despesa NEGATIVA a
// partir de setembro, o que não existe. Uso média móvel dos últimos 3 meses
// (mai-jun-jul) como "tendência recente" — exclui os dois meses atípicos
// sem inventar uma extrapolação artificial — e mostro a média dos 7 meses
// completos como cenário conservador de comparação.

import fs from "node:fs";
import path from "node:path";

const brl = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brlEx = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// --- Dados reais (da planilha do usuário, coluna "Despesas/Empréstimos") ---
const REAL = [
  ["Jan", 283, 2240063.06, 233663.41, 398219.91, 90.07],
  ["Fev", 292, 1782268.77, 173661.48, 410052.67, 56143.54],
  ["Mar", 204, 1669216.33, 189575.60, 158479.74, 79683.72],
  ["Abr", 135, 1053641.01, 115766.38, 140735.84, 89071.14],
  ["Mai", 139, 908886.22, 151618.83, 84771.98, 53108.41],
  ["Jun", 214, 1717232.17, 182346.65, 195847.20, 137940.48],
  ["Jul", 264, 2214170.64, 267811.66, 148636.02, 26889.56],
].map(([mes, viagens, receita, margem, despesas, outras]) => ({
  mes, viagens, receita, margem, despesas, outras,
  resultado_com_outras: margem + outras - despesas,
  resultado_sem_outras: margem - despesas,
}));

const acumuladoRealSemOutras = REAL.reduce((a, m) => a + m.resultado_sem_outras, 0);
const acumuladoRealComOutras = REAL.reduce((a, m) => a + m.resultado_com_outras, 0);

// --- Cenários de projeção (ago-dez, outras receitas = 0) -------------------
const ultimos3 = REAL.slice(-3);
const media = (arr, k) => arr.reduce((a, m) => a + m[k], 0) / arr.length;

const CENARIOS = {
  recente: {
    nome: "Tendência recente (média mai-jun-jul)",
    margem: media(ultimos3, "margem"),
    despesas: media(ultimos3, "despesas"),
  },
  semestre: {
    nome: "Média do semestre completo (jan-jul)",
    margem: media(REAL, "margem"),
    despesas: media(REAL, "despesas"),
  },
};

const MESES_PROJ = ["Ago", "Set", "Out", "Nov", "Dez"];
for (const c of Object.values(CENARIOS)) {
  c.resultadoMensal = c.margem - c.despesas;
  c.serie = [];
  let acumulado = acumuladoRealSemOutras;
  for (const mes of MESES_PROJ) {
    acumulado += c.resultadoMensal;
    c.serie.push({ mes, resultado: c.resultadoMensal, acumulado });
  }
}

// Mês em que o cenário recomendado cruza para acumulado positivo.
const mesCruzamento = CENARIOS.recente.serie.find((s) => s.acumulado > 0)?.mes ?? null;

// --- Série completa (jan-dez) para o gráfico mensal, cenário recomendado ---
const serieMensalCompleta = [
  ...REAL.map((m) => ({ mes: m.mes, resultado: m.resultado_sem_outras, real: true })),
  ...CENARIOS.recente.serie.map((s) => ({ mes: s.mes, resultado: s.resultado, real: false })),
];
const acumuladoCompleto = [
  ...(() => {
    let acc = 0;
    return REAL.map((m) => { acc += m.resultado_sem_outras; return { mes: m.mes, acumulado: acc }; });
  })(),
  ...CENARIOS.recente.serie.map((s) => ({ mes: s.mes, acumulado: s.acumulado })),
];
const acumuladoConservador = [
  ...acumuladoCompleto.slice(0, 7),
  ...CENARIOS.semestre.serie.map((s) => ({ mes: s.mes, acumulado: s.acumulado })),
];

// --- Gráfico 1: barras mensais (real sólido, projetado com textura) -------
function graficoMensal(serie) {
  const L = 800, H = 260, pL = 12, pR = 12, pT = 26, pB = 30;
  const w = L - pL - pR, h = H - pT - pB;
  const max = Math.max(...serie.map((m) => Math.abs(m.resultado))) * 1.15;
  const passo = w / serie.length, bw = Math.min(46, passo * 0.56);
  const meio = pT + h / 2;

  const barras = serie.map((m, i) => {
    const cx = pL + passo * (i + 0.5);
    const bh = (Math.abs(m.resultado) / max) * (h / 2);
    const y = m.resultado >= 0 ? meio - bh : meio;
    const cor = m.resultado < 0 ? "var(--neg)" : "var(--pos)";
    const padrao = m.real ? cor : `url(#hatch)`;
    const rotulo = `${m.mes}${m.real ? "" : " (projetado)"}: ${brlEx(m.resultado)}`;
    return `<g class="it" tabindex="0" aria-label="${esc(rotulo)}">
      <rect class="hit" x="${(cx - passo / 2).toFixed(1)}" y="${pT}" width="${passo.toFixed(1)}" height="${h}"/>
      <rect x="${(cx - bw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3"
        fill="${m.real ? cor : "var(--bg2)"}" ${m.real ? "" : `stroke="${cor}" stroke-width="1.5" stroke-dasharray="3 2"`}/>
      <text class="v sm" x="${cx.toFixed(1)}" y="${(m.resultado >= 0 ? y - 6 : y + bh + 12).toFixed(1)}">${brl(m.resultado)}</text>
      <text class="x" x="${cx.toFixed(1)}" y="${H - 8}">${m.mes}${m.real ? "" : "*"}</text>
      <title>${esc(rotulo)}</title></g>`;
  }).join("");

  return `<svg viewBox="0 0 ${L} ${H}" role="img" class="ch">
    <defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="var(--tx3)" stroke-width="1.4"/></pattern></defs>
    <line class="bl" x1="${pL}" y1="${meio.toFixed(1)}" x2="${L - pR}" y2="${meio.toFixed(1)}"/>
    ${barras}</svg>`;
}

// --- Gráfico 2: acumulado, dois cenários -----------------------------------
function graficoAcumulado(cenA, cenB) {
  const L = 800, H = 280, pL = 14, pR = 14, pT = 24, pB = 30;
  const w = L - pL - pR, h = H - pT - pB;
  const todos = [...cenA, ...cenB].map((p) => p.acumulado);
  const max = Math.max(...todos), min = Math.min(...todos);
  const span = max - min || 1;
  const y = (v) => pT + h - ((v - min) / span) * h;
  const x = (i) => pL + (w / (cenA.length - 1)) * i;
  const yZero = y(0);

  const linha = (serie, cor, tracejado) => {
    const d = serie.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.acumulado).toFixed(1)}`).join(" ");
    const pontos = serie.map((p, i) => `<g class="it" tabindex="0" aria-label="${esc(p.mes)}: acumulado ${brlEx(p.acumulado)}">
      <circle cx="${x(i).toFixed(1)}" cy="${y(p.acumulado).toFixed(1)}" r="4.5" fill="${cor}" stroke="var(--bg2)" stroke-width="1.5"/>
      <title>${esc(p.mes)}: ${brlEx(p.acumulado)}</title></g>`).join("");
    return `<path d="${d}" fill="none" stroke="${cor}" stroke-width="2" ${tracejado ? 'stroke-dasharray="5 4"' : ""}/>${pontos}`;
  };

  const rotulosX = cenA.map((p, i) => `<text class="x" x="${x(i).toFixed(1)}" y="${H - 8}">${p.mes}</text>`).join("");

  return `<svg viewBox="0 0 ${L} ${H}" role="img" class="ch">
    <line class="bl" x1="${pL}" y1="${yZero.toFixed(1)}" x2="${L - pR}" y2="${yZero.toFixed(1)}"/>
    <text class="gl" x="${pL}" y="${(yZero - 5).toFixed(1)}">R$ 0</text>
    ${linha(cenB, "var(--tx3)", true)}
    ${linha(cenA, "var(--s1)", false)}
    ${rotulosX}
  </svg>`;
}

// --- HTML -------------------------------------------------------------------
const html = `<title>DABLIW · Projeção de Resultado — EGM Transportes — Ago a Dez/2026</title>
<style>
  :root{color-scheme:dark}
  .db{--bg:#0F111A;--bg2:#161826;--bg3:#232532;--ln:#3F424D;
    --tx:#F3F5FE;--tx2:#B2B6CA;--tx3:#9397AB;--neg:#E06C6C;--pos:#9397AB;--s1:#E9E9ED;
    font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
    background:var(--bg);color:var(--tx);margin:0;padding:0 0 60px;line-height:1.55;-webkit-font-smoothing:antialiased}
  .wrap{max-width:1000px;margin:0 auto;padding:0 22px}
  .top{border-bottom:1px solid var(--ln);background:var(--bg2);padding:20px 0;margin-bottom:32px}
  .lock{display:flex;align-items:center;gap:12px}
  .badge{width:34px;height:34px;border:1.5px solid var(--tx);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.58rem;letter-spacing:.06em;font-weight:500;flex:none}
  .wm{font-size:1.32rem;font-weight:500;letter-spacing:-.02em}
  .tag{font-size:.62rem;color:var(--tx3);letter-spacing:.14em;text-transform:uppercase;margin-top:1px}
  h1{font-size:1.4rem;font-weight:500;margin:0 0 6px;letter-spacing:-.02em}
  .sub{color:var(--tx3);font-size:.83rem;margin:0 0 26px}
  .kicker{font-size:.66rem;letter-spacing:.15em;text-transform:uppercase;color:var(--tx3);margin-bottom:6px}
  .card{background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:22px;margin-bottom:16px}
  h2{font-size:.95rem;font-weight:500;margin:0 0 4px;letter-spacing:-.01em}
  .note{color:var(--tx3);font-size:.79rem;margin:5px 0 0}
  .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:18px}
  .tile{background:var(--bg2);border:1px solid var(--ln);border-radius:10px;padding:16px 18px}
  .tile .r{font-size:.7rem;color:var(--tx3);letter-spacing:.06em;text-transform:uppercase;margin-bottom:7px}
  .tile .v{font-size:1.5rem;font-weight:500;letter-spacing:-.025em}
  .tile .v.neg{color:var(--neg)}.tile .v.pos{color:#9DBF9D}
  .tile .s{font-size:.74rem;color:var(--tx3);margin-top:3px}
  .alerts{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
  .al{display:flex;gap:11px;background:var(--bg2);border:1px solid var(--ln);border-left:2px solid var(--tx2);border-radius:8px;padding:11px 14px;font-size:.81rem;color:var(--tx2)}
  .al .i{flex:none;font-weight:600;color:var(--tx)}
  .al.hard{border-left-color:var(--neg)}
  .ch{width:100%;height:auto;overflow:visible;margin-top:6px}
  .ch .bl{stroke:var(--ln);stroke-width:1}
  .ch .gl{fill:var(--tx3);font-size:10px}
  .ch .v{fill:var(--tx);font-size:10.5px;font-weight:500;text-anchor:middle}
  .ch .v.sm{font-size:9.5px}
  .ch .x{fill:var(--tx3);font-size:10px;text-anchor:middle}
  .ch .hit{fill:transparent}
  .ch .it:hover .hit,.ch .it:focus-visible .hit{fill:rgba(255,255,255,.05)}
  .ch .it:focus-visible{outline:none}
  .lg{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px;font-size:.75rem;color:var(--tx3)}
  .lg span{display:inline-flex;align-items:center;gap:6px}
  .sw{width:16px;height:2px;flex:none}
  .sw.dash{background:repeating-linear-gradient(90deg,var(--tx3) 0 4px,transparent 4px 7px)}
  table{width:100%;border-collapse:collapse;font-size:.78rem}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--ln)}
  th{color:var(--tx3);font-weight:500;font-size:.72rem;letter-spacing:.05em;text-transform:uppercase}
  td{color:var(--tx2)}
  td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
  td.neg{color:var(--neg)}td.pos{color:#9DBF9D}
  .meth{font-size:.81rem;color:var(--tx2);padding-left:18px}
  .meth li{margin-bottom:8px}
  .foot{border-top:1px solid var(--ln);margin-top:26px;padding-top:16px;font-size:.72rem;color:var(--tx3)}
</style>
<div class="db"><div class="top"><div class="wrap"><div class="lock">
  <div class="badge">BPO</div>
  <div><div class="wm">DABLIW.</div><div class="tag">Business Process Outsourcing</div></div>
</div></div></div>

<div class="wrap">
  <div class="kicker">Projeção de resultado</div>
  <h1>EGM TRANSPORTES E LOGISTICA LTDA</h1>
  <p class="sub">Real: jan-jul/2026 · Projetado: ago-dez/2026, sem outras receitas · baseado nos valores reclassificados da planilha do usuário (coluna "Despesas/Empréstimos")</p>

  <div class="tiles">
    <div class="tile"><div class="r">Acumulado jan-jul (sem outras receitas)</div>
      <div class="v neg">${brl(acumuladoRealSemOutras)}</div>
      <div class="s">com outras receitas seria ${brl(acumuladoRealComOutras)}</div></div>
    <div class="tile"><div class="r">Resultado projetado por mês (cenário recomendado)</div>
      <div class="v pos">${brl(CENARIOS.recente.resultadoMensal)}</div>
      <div class="s">média de margem e despesas de mai-jun-jul</div></div>
    <div class="tile"><div class="r">Acumulado em dez/2026 (cenário recomendado)</div>
      <div class="v pos">${brl(CENARIOS.recente.serie.at(-1).acumulado)}</div>
      <div class="s">cruza para positivo em ${mesCruzamento ?? "—"}/2026</div></div>
    <div class="tile"><div class="r">Acumulado em dez/2026 (cenário conservador)</div>
      <div class="v neg">${brl(CENARIOS.semestre.serie.at(-1).acumulado)}</div>
      <div class="s">se voltar à média dos 7 meses completos</div></div>
  </div>

  <div class="alerts">
    <div class="al hard"><span class="i">!</span><div>Sem outras receitas, jan-jul fecha NEGATIVO em ${brl(acumuladoRealSemOutras)} — foram os R$442.926,92 de outras receitas que levaram o período ao azul. A projeção abaixo não conta com isso, como pedido.</div></div>
    <div class="al"><span class="i">!</span><div>Regressão linear sobre as despesas foi descartada: a queda de jan/fev (~R$400k, inflados por adiantamentos pontuais) para maio (R$85k) é tão acentuada que a reta projetaria despesa negativa a partir de setembro.</div></div>
    <div class="al"><span class="i">!</span><div>O cenário recomendado só se sustenta se os adiantamentos/empréstimos pontuais de jan-fev não se repetirem — são eles que explicam a diferença entre os dois cenários.</div></div>
  </div>

  <div class="card">
    <h2>Resultado mensal — real (jan-jul) e projetado (ago-dez)*</h2>
    <p class="note">*Barras tracejadas = projeção pelo cenário recomendado (tendência recente). Sem outras receitas em nenhum mês.</p>
    ${graficoMensal(serieMensalCompleta)}
  </div>

  <div class="card">
    <h2>Resultado acumulado — dois cenários</h2>
    <p class="note">Linha sólida: tendência recente (mai-jun-jul). Linha tracejada: média do semestre completo (jan-jul), cenário conservador de comparação.</p>
    ${graficoAcumulado(acumuladoCompleto, acumuladoConservador)}
    <div class="lg">
      <span><span class="sw" style="background:var(--s1)"></span>Tendência recente — cruza a linha zero em ${mesCruzamento ?? "—"}/2026</span>
      <span><span class="sw dash"></span>Média do semestre completo — não recupera em 2026</span>
    </div>
  </div>

  <div class="card">
    <h2>Detalhe mês a mês</h2>
    <div class="scroll"><table>
      <thead><tr><th>Mês</th><th class="n">Margem</th><th class="n">Despesas/Empréstimos</th><th class="n">Resultado (sem outras)</th><th class="n">Acumulado (cenário recomendado)</th></tr></thead>
      <tbody>
        ${REAL.map((m) => `<tr><td>${m.mes}/26 (real)</td><td class="n">${brlEx(m.margem)}</td><td class="n">${brlEx(m.despesas)}</td><td class="n${m.resultado_sem_outras < 0 ? " neg" : " pos"}">${brlEx(m.resultado_sem_outras)}</td><td class="n${acumuladoCompleto[REAL.indexOf(m)].acumulado < 0 ? " neg" : " pos"}">${brlEx(acumuladoCompleto[REAL.indexOf(m)].acumulado)}</td></tr>`).join("")}
        ${CENARIOS.recente.serie.map((s) => `<tr><td>${s.mes}/26 (projetado)</td><td class="n">${brlEx(CENARIOS.recente.margem)}</td><td class="n">${brlEx(CENARIOS.recente.despesas)}</td><td class="n pos">${brlEx(s.resultado)}</td><td class="n${s.acumulado < 0 ? " neg" : " pos"}">${brlEx(s.acumulado)}</td></tr>`).join("")}
      </tbody>
    </table></div>
  </div>

  <div class="card">
    <h2>Metodologia</h2>
    <ul class="meth">
      <li><strong>Base de dados:</strong> valores exatos da aba DASHBOARD da planilha após a reclassificação feita pelo usuário — "Despesas" virou "Despesas/Empréstimos" (inclui de volta adiantamentos, empréstimos e estornos, que antes eu havia separado como "não é despesa de resultado").</li>
      <li><strong>Sem outras receitas</strong> em nenhum mês projetado, por instrução explícita. É a premissa que mais pesa no resultado: os R$442.926,92 recebidos em outras receitas de jan-jul foram o que levou o período ao azul.</li>
      <li><strong>Cenário recomendado</strong> = média de margem de frete e de despesas dos últimos 3 meses reais (mai, jun, jul), replicada de ago a dez. Escolhido em vez de regressão linear porque a série de despesas tem dois outliers no início do ano (adiantamentos pontuais) que fariam qualquer reta simples divergir para valores impossíveis.</li>
      <li><strong>Cenário conservador</strong> = média dos 7 meses completos (jan-jul), incluindo os outliers de jan-fev. Serve de contraponto: mostra que a recuperação depende de sustentar o patamar recente, não de "a média do ano".</li>
      <li>Nenhum dos dois cenários é uma garantia — são dois pontos de referência a partir do mesmo histórico. O real de ago/2026 em diante deve substituir a projeção assim que existir.</li>
    </ul>
  </div>

  <div class="foot"><strong style="color:var(--tx2)">DABLIW.</strong> · Business Process Outsourcing · Projeção gerada a partir da planilha de auditoria enviada pelo usuário.</div>
</div></div>`;

const saida = process.argv[2] ?? path.join("outputs", "dashboards", "DABLIW_EGM_projecao_2026-08-a-12.html");
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, html, "utf8");
console.log(saida);
