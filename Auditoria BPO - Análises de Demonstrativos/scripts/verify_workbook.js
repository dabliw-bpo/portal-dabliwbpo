#!/usr/bin/env node
// Substituto do recalc.py (LibreOffice) desta skill nesta máquina, que não
// tem Python nem LibreOffice instalados. Lê o .xlsx escrito pelo exceljs,
// recalcula TODAS as fórmulas com o hyperformula (motor de cálculo real,
// independente de Excel) e reporta erros — igual ao recalc.py reporta
// errors_found. Além disso, compara os totais do Dashboard contra o JSON
// consolidado já auditado, que é a fonte da verdade independente.
//
// Uso:
//   node verify_workbook.js <arquivo.xlsx> [consolidado.json]

import ExcelJS from "exceljs";
import { HyperFormula } from "hyperformula";
import fs from "node:fs";

const [, , arquivo, consolidadoPath] = process.argv;
if (!arquivo) {
  console.error("uso: node verify_workbook.js <arquivo.xlsx> [consolidado.json]");
  process.exit(1);
}

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(arquivo);

const sheets = {};
wb.eachSheet((ws) => {
  const rows = [];
  ws.eachRow({ includeEmpty: true }, (row, rn) => {
    const vals = [];
    row.eachCell({ includeEmpty: true }, (cell, cn) => {
      vals[cn - 1] = cell.formula != null ? cell.formula : (cell.value ?? null);
    });
    rows[rn - 1] = vals;
  });
  sheets[ws.name] = rows;
});

const hf = HyperFormula.buildFromSheets(sheets, { licenseKey: "gpl-v3" });

// --- 1. Erros de fórmula em toda a pasta -----------------------------------
let totalFormulas = 0;
let erros = [];
for (const nome of hf.getSheetNames()) {
  const id = hf.getSheetId(nome);
  const dims = hf.getSheetDimensions(id);
  for (let r = 0; r < dims.height; r++) {
    for (let c = 0; c < dims.width; c++) {
      const addr = { sheet: id, row: r, col: c };
      if (!hf.doesCellHaveFormula(addr)) continue;
      totalFormulas++;
      const v = hf.getCellValue(addr);
      if (v && typeof v === "object" && v.type === "ERROR") {
        erros.push({ aba: nome, celula: `R${r + 1}C${c + 1}`, erro: v.value, msg: v.message });
      }
    }
  }
}

console.log(`fórmulas verificadas: ${totalFormulas}`);
console.log(`erros encontrados: ${erros.length}`);
if (erros.length) {
  console.log(JSON.stringify(erros.slice(0, 50), null, 2));
  process.exitCode = 1;
}

// --- 2. Conferência de valores contra o JSON já auditado -------------------
if (consolidadoPath && fs.existsSync(consolidadoPath)) {
  const d = JSON.parse(fs.readFileSync(consolidadoPath, "utf8"));
  const dashId = hf.getSheetId("DASHBOARD");
  const linhaDoMes = (mesISO) => {
    const [, mm] = mesISO.split("-");
    return 4 + Number.parseInt(mm, 10); // R_TAB_START(5)=jan(mês 1) -> linha 5
  };
  const colIdx = { viagens: 1, receita: 2, margem: 3, estrutura: 5, outras: 6, resultado: 7 };
  const get = (row, col) => hf.getCellValue({ sheet: dashId, row, col });

  const checar = (rotulo, obtido, esperado, tol = 0.5) => {
    const ok = Math.abs(obtido - esperado) <= tol;
    console.log(`${ok ? "OK  " : "FALHA"} ${rotulo}: planilha=${obtido} | json=${esperado}`);
    if (!ok) process.exitCode = 1;
  };

  for (const m of d.mensal) {
    const r = linhaDoMes(m.mes) - 1; // 0-based
    checar(`${m.mes} viagens`, get(r, colIdx.viagens), m.viagens, 0.01);
    checar(`${m.mes} receita`, get(r, colIdx.receita), m.receita);
    checar(`${m.mes} margem`, get(r, colIdx.margem), m.margem);
  }

  const rTotal = 4 + 12; // R_TAB_TOTAL (linha 17), 0-based = 16
  checar("TOTAL receita", get(rTotal, colIdx.receita), d.operacao_frete.receita_frete);
  checar("TOTAL margem", get(rTotal, colIdx.margem), d.operacao_frete.margem_frete);
  checar("TOTAL despesas estrutura", get(rTotal, colIdx.estrutura), d.consolidado.despesas_estrutura);
  checar("TOTAL outras receitas", get(rTotal, colIdx.outras), d.consolidado.outras_receitas);
  checar("TOTAL resultado", get(rTotal, colIdx.resultado), d.consolidado.resultado);
}

if (process.exitCode) {
  console.log("\nVERIFICAÇÃO FALHOU");
} else {
  console.log("\nVERIFICAÇÃO OK — zero erros de fórmula, valores batem com o JSON auditado.");
}
