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

function detectarEParsear(texto) {
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

const arquivos = process.argv.slice(2);
if (arquivos.length === 0) {
  console.error("uso: node parse_pdf_reports.js <arquivo.pdf> [...]");
  process.exit(1);
}

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

console.log(JSON.stringify({ blocos }, null, 2));
