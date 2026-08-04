#!/usr/bin/env node
// Parsing determinístico de exports financeiros brasileiros.
// Usado pelo agente `financial-data-ingestor` (ver financial-analysis/CLAUDE.md
// e .claude/skills/financial-data-ingest/SKILL.md).
//
// Uso:
//   node parse_exports.js ofx <arquivo.ofx>
//   node parse_exports.js table <arquivo.csv|arquivo.xlsx> [--sheet=Nome]
//   node parse_exports.js normalize-valor "R$ 1.234,56"
//   node parse_exports.js normalize-data "05/07/2026"

import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

function normalizeValorBR(raw) {
  if (typeof raw === "number") return raw;
  const limpo = String(raw).replace(/R\$/gi, "").trim().replace(/\./g, "").replace(",", ".");
  const valor = parseFloat(limpo);
  if (Number.isNaN(valor)) throw new Error(`valor inválido: ${raw}`);
  return valor;
}

function normalizeDataBR(raw) {
  const m = String(raw).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new Error(`data inválida (esperado dd/mm/aaaa): ${raw}`);
  const [, d, mo, y] = m;
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

// OFX 1.x é um SGML "solto" (tags sem fechamento obrigatório), então extraímos
// por regex em vez de um parser XML — schema de <STMTTRN> é fixo pelo padrão,
// então isso é 100% mecânico, sem ambiguidade que exija julgamento do agente.
function parseOfx(filePath) {
  const raw = fs.readFileSync(filePath, "latin1");
  const blocks = raw.split(/<STMTTRN>/i).slice(1);

  return blocks
    .map((block) => {
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
        return m ? m[1].trim() : null;
      };
      const dtposted = get("DTPOSTED"); // formato AAAAMMDD[hhmmss]
      const trnamt = get("TRNAMT");
      const memo = get("MEMO") || get("NAME") || "";
      if (!dtposted || !trnamt) return null;

      const valor = parseFloat(trnamt);
      if (Number.isNaN(valor)) return null;

      return {
        data: `${dtposted.slice(0, 4)}-${dtposted.slice(4, 6)}-${dtposted.slice(6, 8)}`,
        descricao: memo,
        valor: Math.abs(valor),
        tipo: valor < 0 ? "saida" : "entrada",
        origem: "banco",
        arquivo_fonte: path.basename(filePath),
      };
    })
    .filter(Boolean);
}

// CSV/XLSX de ERP/Conta Azul têm cabeçalhos ad hoc — este comando só faz a
// extração mecânica das linhas; mapear qual coluna é data/valor/descrição é
// julgamento do agente (ver financial-data-ingest SKILL.md), que deve então
// chamar normalize-valor/normalize-data para converter os valores brutos.
function parseTable(filePath, sheetName) {
  const wb = XLSX.readFile(filePath, { raw: false });
  const sheet = wb.Sheets[sheetName || wb.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
  return { arquivo: path.basename(filePath), planilhas_disponiveis: wb.SheetNames, linhas };
}

const [, , cmd, ...args] = process.argv;

try {
  switch (cmd) {
    case "ofx":
      console.log(JSON.stringify(parseOfx(args[0]), null, 2));
      break;
    case "table": {
      const sheetArg = args.find((a) => a.startsWith("--sheet="));
      const sheetName = sheetArg ? sheetArg.split("=")[1] : undefined;
      console.log(JSON.stringify(parseTable(args[0], sheetName), null, 2));
      break;
    }
    case "normalize-valor":
      console.log(JSON.stringify(normalizeValorBR(args[0])));
      break;
    case "normalize-data":
      console.log(JSON.stringify(normalizeDataBR(args[0])));
      break;
    default:
      console.error("uso: node parse_exports.js <ofx|table|normalize-valor|normalize-data> ...");
      process.exit(1);
  }
} catch (err) {
  console.error(JSON.stringify({ erro: err.message }));
  process.exit(1);
}
