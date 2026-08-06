#!/usr/bin/env node
// Extração determinística dos relatórios PDF do ERP de transportes.
//
// Cobre dois layouts de relatório (identificados pelo cabeçalho interno):
//   - RelViagensLucr    "Relatório de Lucratividade de Viagens por Filial"
//   - RelDespesasGerais "Relatório de Despesas Gerais"
//
// Princípio (ver CLAUDE.md nesta pasta): usamos os TOTAIS QUE O PRÓPRIO
// RELATÓRIO IMPRIME, não uma re-soma das linhas de detalhe. O ERP é a fonte
// da verdade; re-somar 1.319 viagens linha a linha introduziria erro de
// parsing sem ganho nenhum. As linhas de detalhe só são lidas para conferir
// que o total bate (ver `validar`).
//
// Uso:
//   node parse_pdf_reports.js <arquivo.pdf> [...mais arquivos]
// Imprime um JSON com os blocos reconhecidos em stdout.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFParse } from "pdf-parse";

// "1.234,56" -> 1234.56 | "-25,00" -> -25
function valorBR(raw) {
  if (raw == null) return null;
  const limpo = String(raw).trim().replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(limpo);
  return Number.isNaN(n) ? null : n;
}

async function textoDoPdf(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const { text } = await parser.getText();
    return text;
  } finally {
    await parser.destroy();
  }
}

function periodoDoCabecalho(texto) {
  // "... 01/01/2026 00:00:00.0 a 30/06/2026 23:59:59.0"
  const m = texto.match(
    /(\d{2}\/\d{2}\/\d{4})\s[\d:.]+\sa\s(\d{2}\/\d{2}\/\d{4})/,
  );
  return m ? { inicio: m[1], fim: m[2] } : { inicio: null, fim: null };
}

function empresaDoCabecalho(texto) {
  const primeira = texto.split("\n").find((l) => l.trim().length > 0);
  return primeira ? primeira.trim() : null;
}

// ---------------------------------------------------------------------------
// Lucratividade de viagens
// ---------------------------------------------------------------------------
// O rodapé do relatório imprime um demonstrativo fechado:
//   (+)Frete Empresa : 9.660.831,29
//   (+)Pedágio Não Emb. : 100.995,19
//   (+)Outros Desc.Mot : 23.955,00
//   Total Receitas : 9.785.781,48
//   (-)Frete Motorista : 8.331.070,68
//   (-)ICMS : 323.652,81
//   (-)Pedágio : 100.995,19
//   Total Despesas : 8.755.718,68
//   Margem Frete : 1.030.062,80
// Extrai as linhas de viagem individuais (uma por conhecimento de transporte).
//
// O mapeamento das colunas foi obtido por engenharia reversa e é verificado
// pelo validar(): a soma das margens tem de bater com a "Margem Frete"
// impressa e a contagem de linhas com o "Total Viagens". Sem isso não use.
//
// Cuidado com o número de campos: linhas com e sem peso de saída produzem 18
// ou 17 campos. Por isso o frete da empresa é lido pelo FIM da linha, nunca
// por índice fixo.
function extrairViagens(texto) {
  const viagens = [];
  let clienteAtual = null;

  for (const linha of texto.split("\n")) {
    const t = linha.trim();

    const mCliente = t.match(/^Cliente:\s*\d+\s*-\s*(.+)$/);
    if (mCliente) {
      clienteAtual = mCliente[1].trim();
      continue;
    }

    const mData = t.match(/^(\d{2})\/(\d{2})\/(\d{4})\s/);
    if (!mData) continue;

    const campos = t.split(/[\s\t]+/).slice(1);
    if (campos.length < 17) continue;

    const freteEmpresa = valorBR(campos[campos.length - 1]);
    const freteMotorista = valorBR(campos[1]);
    const margem = valorBR(campos[11]);
    if (freteEmpresa == null || margem == null) continue;

    viagens.push({
      data: `${mData[3]}-${mData[2]}-${mData[1]}`,
      mes: `${mData[3]}-${mData[2]}`,
      cliente: clienteAtual ?? "(sem cliente identificado)",
      frete_empresa: freteEmpresa,
      frete_motorista: freteMotorista ?? 0,
      margem,
    });
  }
  return viagens;
}

function agregar(viagens, chave) {
  const mapa = new Map();
  for (const v of viagens) {
    const k = v[chave];
    const acc = mapa.get(k) ?? { [chave]: k, viagens: 0, frete_empresa: 0, margem: 0 };
    acc.viagens += 1;
    acc.frete_empresa += v.frete_empresa;
    acc.margem += v.margem;
    mapa.set(k, acc);
  }
  return [...mapa.values()].map((a) => ({
    ...a,
    frete_empresa: Number(a.frete_empresa.toFixed(2)),
    margem: Number(a.margem.toFixed(2)),
    margem_pct: Number(((a.margem / a.frete_empresa) * 100).toFixed(2)),
  }));
}

// Cruzamento mês × cliente. Necessário para recompor a série mensal quando
// algum cliente é excluído do relatório: sem ele a exclusão mexeria nos
// totais mas não nos meses, e o dashboard não fecharia consigo mesmo.
//
// Usa Map aninhado em vez de chave de texto concatenada — nome de cliente
// contém espaços, e qualquer separador escolhido vira uma aposta.
function cruzarMesCliente(viagens) {
  const porMes = new Map();
  for (const v of viagens) {
    const porCliente = porMes.get(v.mes) ?? new Map();
    const acc = porCliente.get(v.cliente) ?? { viagens: 0, frete_empresa: 0, margem: 0 };
    acc.viagens += 1;
    acc.frete_empresa += v.frete_empresa;
    acc.margem += v.margem;
    porCliente.set(v.cliente, acc);
    porMes.set(v.mes, porCliente);
  }

  const saida = [];
  for (const [mes, porCliente] of porMes) {
    for (const [cliente, a] of porCliente) {
      saida.push({
        mes,
        cliente,
        viagens: a.viagens,
        frete_empresa: Number(a.frete_empresa.toFixed(2)),
        margem: Number(a.margem.toFixed(2)),
      });
    }
  }
  return saida.sort((a, b) => a.mes.localeCompare(b.mes) || b.frete_empresa - a.frete_empresa);
}

function parseLucratividade(texto) {
  // Rótulos com acento/ponto variam; casamos pelo prefixo e pegamos o número
  // após os dois-pontos.
  const capturar = (rotulo) => {
    const re = new RegExp(
      `${rotulo}\\s*:\\s*(-?[\\d.]+,\\d{2})`,
      "i",
    );
    const m = texto.match(re);
    return m ? valorBR(m[1]) : null;
  };

  const totalViagens = (() => {
    const m = texto.match(/Total Viagens:\s*(\d+)/i);
    return m ? Number.parseInt(m[1], 10) : null;
  })();

  const viagens = extrairViagens(texto);

  const receitas = {
    frete_empresa: capturar("\\(\\+\\)Frete Empresa"),
    pedagio_nao_embutido: capturar("\\(\\+\\)Ped[áa]gio N[ãa]o Emb\\."),
    outros_desc_motorista: capturar("\\(\\+\\)Outros Desc\\.Mot"),
  };
  const despesas = {
    frete_motorista: capturar("\\(-\\)Frete Motorista"),
    icms: capturar("\\(-\\)ICMS"),
    pedagio: capturar("\\(-\\)Ped[áa]gio"),
  };

  return {
    relatorio: "lucratividade_viagens",
    periodo: periodoDoCabecalho(texto),
    empresa: empresaDoCabecalho(texto),
    total_viagens: totalViagens,
    receitas,
    despesas,
    total_receitas: capturar("Total Receitas"),
    total_despesas: capturar("Total Despesas"),
    margem_frete: capturar("Margem Frete"),
    // Base sobre a qual o ERP calcula a margem % impressa (10,72), que não é
    // total_receitas — ver validar().
    total_rotas_detalhadas: (texto.match(/Total da Rota:/g) || []).length,
    total_clientes: (texto.match(/Total do Cliente:/g) || []).length,
    // Corte mensal e por cliente, vindos das linhas de viagem. Só confie
    // depois de checar avisos_validacao — ver validar().
    por_mes: agregar(viagens, "mes").sort((a, b) => a.mes.localeCompare(b.mes)),
    por_cliente: agregar(viagens, "cliente").sort(
      (a, b) => b.frete_empresa - a.frete_empresa,
    ),
    // Cruzamento mês × cliente: necessário para recompor a série mensal
    // quando algum cliente é excluído do relatório. Sem ele a exclusão
    // mexeria nos totais mas não nos meses, e o dashboard não fecharia
    // consigo mesmo.
    por_mes_cliente: cruzarMesCliente(viagens),
    viagens_detalhadas: viagens.length,
    frete_empresa_detalhado: Number(
      viagens.reduce((a, v) => a + v.frete_empresa, 0).toFixed(2),
    ),
    margem_detalhada: Number(viagens.reduce((a, v) => a + v.margem, 0).toFixed(2)),
  };
}

// ---------------------------------------------------------------------------
// Despesas gerais
// ---------------------------------------------------------------------------
// Cada item de despesa fecha com uma linha:
//   "<valor>\t<quantidade>\tTotais Item - <NOME> - <id>:"
// e o relatório encerra com:
//   "<quantidade>\t<valor>\tTotal Geral:"   (ordem invertida!)
function parseDespesas(texto) {
  const itens = [];
  const reItem =
    /(-?[\d.]+,\d{2})\t(-?[\d.]+,\d{2})\tTotais Item - (.+?) - (\d+):/g;
  let m;
  while ((m = reItem.exec(texto)) !== null) {
    itens.push({
      item: m[3].trim(),
      codigo: Number.parseInt(m[4], 10),
      valor: valorBR(m[1]),
      quantidade: valorBR(m[2]),
    });
  }

  const mGeral = texto.match(
    /(-?[\d.]+,\d{2})\s+(-?[\d.]+,\d{2})\s*\tTotal Geral:/,
  );

  return {
    relatorio: "despesas_gerais",
    periodo: periodoDoCabecalho(texto),
    empresa: empresaDoCabecalho(texto),
    itens: itens.sort((a, b) => b.valor - a.valor),
    quantidade_itens: itens.length,
    // No rodapé a ordem é quantidade, depois valor.
    total_geral_quantidade: mGeral ? valorBR(mGeral[1]) : null,
    total_geral: mGeral ? valorBR(mGeral[2]) : null,
  };
}

// ---------------------------------------------------------------------------
// Receitas gerais ("RECEITAS DIVERSAS")
// ---------------------------------------------------------------------------
// Layout: grupos fecham com
//   "<qtd>\tTotais Grupo - <NOME> - <id>: R$ <valor>"
// e o relatório encerra com
//   "<qtd> R$ <valor>\tTotal Geral:"
//
// O grupo RECEITA OPERACIONAL é EXCLUÍDO por decisão do cliente (ago/2026):
// ele contém RECEITA COM FRETES, que é a mesma receita já apurada no
// relatório de lucratividade. Somar os dois contaria o frete duas vezes.
const GRUPOS_RECEITA_EXCLUIDOS = ["RECEITA OPERACIONAL"];

// Itens de receita excluídos por decisão do cliente (ago/2026), por código.
//   484 REEMBOLSOS DIVERSOS — reembolso é dinheiro que volta, não receita
//       ganha; mesma lógica dos adiantamentos do lado da despesa.
const ITENS_RECEITA_EXCLUIDOS = {
  484: "REEMBOLSOS DIVERSOS — reembolso não é receita ganha",
};

function parseReceitas(texto) {
  // Itens fecham com "R$ <valor>\t<qtd>\tTotais Item - <NOME> - <id>:"
  // (repare que aqui o R$ vem ANTES do valor, ao contrário do relatório de
  // despesas — os dois layouts não compartilham formatação).
  const itens = [];
  const reItem =
    /R\$\s*(-?[\d.]+,\d{2})\s*\t(\d+)\s*\tTotais Item - (.+?) - (\d+):/g;
  let mi;
  while ((mi = reItem.exec(texto)) !== null) {
    const codigo = Number.parseInt(mi[4], 10);
    itens.push({
      item: mi[3].trim(),
      codigo,
      lancamentos: Number.parseInt(mi[2], 10),
      valor: valorBR(mi[1]),
      excluido: Object.hasOwn(ITENS_RECEITA_EXCLUIDOS, codigo),
      motivo_exclusao: ITENS_RECEITA_EXCLUIDOS[codigo] ?? null,
    });
  }

  const grupos = [];
  const re = /(\d+)\s*\tTotais Grupo - (.+?) - (\d+):\s*R\$\s*(-?[\d.]+,\d{2})/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    const nome = m[2].trim();
    grupos.push({
      grupo: nome,
      codigo: Number.parseInt(m[3], 10),
      lancamentos: Number.parseInt(m[1], 10),
      valor: valorBR(m[4]),
      excluido: GRUPOS_RECEITA_EXCLUIDOS.some((g) => nome.toUpperCase().includes(g)),
    });
  }

  const mGeral = texto.match(/(\d+)\s+R\$\s*(-?[\d.]+,\d{2})\s*\tTotal Geral:/);
  const considerados = grupos.filter((g) => !g.excluido);
  const receitaDeGrupos = considerados.reduce((a, g) => a + g.valor, 0);

  // Mapa item -> grupo, lido das linhas de declaração
  // "Item: <NOME> - <id> Grupo: <GRUPO> - <gid>". Necessário para não
  // subtrair duas vezes um item excluído que já esteja dentro de um grupo
  // excluído.
  const grupoDoItem = new Map();
  const reDecl = /Item:\s*.+? - (\d+)\s+Grupo:\s*(.+?) - \d+/g;
  let md;
  while ((md = reDecl.exec(texto)) !== null) {
    grupoDoItem.set(Number.parseInt(md[1], 10), md[2].trim().toUpperCase());
  }

  const itensExcluidos = itens.filter((i) => {
    if (!i.excluido) return false;
    const g = grupoDoItem.get(i.codigo);
    // Já dentro de grupo excluído? Então não subtrai de novo.
    return !(g && GRUPOS_RECEITA_EXCLUIDOS.some((ge) => g.includes(ge)));
  });
  const totalItensExcluidos = itensExcluidos.reduce((a, i) => a + i.valor, 0);

  return {
    relatorio: "receitas_gerais",
    periodo: periodoDoCabecalho(texto),
    empresa: empresaDoCabecalho(texto),
    grupos: grupos.sort((a, b) => b.valor - a.valor),
    itens: itens.sort((a, b) => b.valor - a.valor),
    total_geral: mGeral ? valorBR(mGeral[2]) : null,
    total_excluido: Number(
      grupos.filter((g) => g.excluido).reduce((a, g) => a + g.valor, 0).toFixed(2),
    ),
    itens_excluidos: itensExcluidos.map((i) => ({
      item: i.item,
      codigo: i.codigo,
      valor: i.valor,
      motivo: i.motivo_exclusao,
    })),
    total_itens_excluidos: Number(totalItensExcluidos.toFixed(2)),
    // O que entra na análise: tudo menos a receita de frete e menos os itens
    // vetados individualmente.
    outras_receitas: Number((receitaDeGrupos - totalItensExcluidos).toFixed(2)),
  };
}

function detectarEParsear(texto) {
  if (/Relat[óo]rio de Receitas Gerais/i.test(texto)) {
    return parseReceitas(texto);
  }
  if (/Relat[óo]rio de Lucratividade de Viagens/i.test(texto)) {
    return parseLucratividade(texto);
  }
  if (/Relat[óo]rio de Despesas Gerais/i.test(texto)) {
    return parseDespesas(texto);
  }
  return { relatorio: "desconhecido", erro: "layout de relatório não reconhecido" };
}

// Conferências internas: o objetivo é detectar parsing silenciosamente errado.
function validar(bloco) {
  const avisos = [];
  const perto = (a, b, tol = 0.05) =>
    a != null && b != null && Math.abs(a - b) <= tol;

  if (bloco.relatorio === "lucratividade_viagens") {
    const somaRec = Object.values(bloco.receitas).reduce(
      (acc, v) => acc + (v ?? 0),
      0,
    );
    const somaDesp = Object.values(bloco.despesas).reduce(
      (acc, v) => acc + (v ?? 0),
      0,
    );
    if (!perto(somaRec, bloco.total_receitas)) {
      avisos.push(
        `Soma das receitas (${somaRec.toFixed(2)}) difere do Total Receitas impresso (${bloco.total_receitas}).`,
      );
    }
    if (!perto(somaDesp, bloco.total_despesas)) {
      avisos.push(
        `Soma das despesas (${somaDesp.toFixed(2)}) difere do Total Despesas impresso (${bloco.total_despesas}).`,
      );
    }
    const margemCalc = bloco.total_receitas - bloco.total_despesas;
    if (!perto(margemCalc, bloco.margem_frete)) {
      avisos.push(
        `Receitas - Despesas (${margemCalc.toFixed(2)}) difere da Margem Frete impressa (${bloco.margem_frete}).`,
      );
    }

    // Portão do corte mensal/por cliente: as linhas de viagem só podem ser
    // usadas se reproduzirem os totais que o ERP imprime.
    if (bloco.viagens_detalhadas !== bloco.total_viagens) {
      avisos.push(
        `Linhas de viagem lidas (${bloco.viagens_detalhadas}) diferem do Total Viagens impresso (${bloco.total_viagens}) — corte mensal e por cliente não confiáveis.`,
      );
    }
    if (!perto(bloco.margem_detalhada, bloco.margem_frete, 1.0)) {
      avisos.push(
        `Soma das margens por viagem (${bloco.margem_detalhada}) difere da Margem Frete impressa (${bloco.margem_frete}) — corte mensal e por cliente não confiáveis.`,
      );
    }
  }

  if (bloco.relatorio === "receitas_gerais") {
    const soma = bloco.grupos.reduce((a, g) => a + (g.valor ?? 0), 0);
    if (!perto(soma, bloco.total_geral, 1.0)) {
      avisos.push(
        `Soma dos ${bloco.grupos.length} grupos de receita (${soma.toFixed(2)}) difere do Total Geral impresso (${bloco.total_geral}).`,
      );
    }
    if (bloco.grupos.length === 0) {
      avisos.push("Nenhum grupo de receita reconhecido no relatório.");
    }
  }

  if (bloco.relatorio === "despesas_gerais") {
    const soma = bloco.itens.reduce((acc, i) => acc + (i.valor ?? 0), 0);
    // Tolerância maior: arredondamento por item ao longo de 57 subtotais.
    if (!perto(soma, bloco.total_geral, 1.0)) {
      avisos.push(
        `Soma dos ${bloco.itens.length} itens (${soma.toFixed(2)}) difere do Total Geral impresso (${bloco.total_geral}).`,
      );
    }
  }

  return avisos;
}

// API de módulo — usada tanto pelo CLI abaixo quanto pelo servidor web, que
// importa isto direto em processo (spawnar um filho por PDF pagaria o startup
// do Node e o import do pdf-parse de novo: ~2s por chamada).
export async function parsearRelatorios(arquivos) {
  const blocos = [];
  for (const arquivo of arquivos) {
    try {
      const texto = await textoDoPdf(arquivo);
      const bloco = detectarEParsear(texto);
      bloco.arquivo_fonte = path.basename(arquivo);
      bloco.avisos_validacao = validar(bloco);
      blocos.push(bloco);
    } catch (err) {
      blocos.push({
        arquivo_fonte: path.basename(arquivo),
        relatorio: "erro",
        erro: err.message,
      });
    }
  }
  return blocos;
}

// Só roda como CLI quando invocado direto, não quando importado.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const arquivos = process.argv.slice(2);
  if (arquivos.length === 0) {
    console.error("uso: node parse_pdf_reports.js <arquivo.pdf> [...]");
    process.exit(1);
  }
  console.log(JSON.stringify({ blocos: await parsearRelatorios(arquivos) }, null, 2));
}
