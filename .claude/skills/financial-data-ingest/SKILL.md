---
name: financial-data-ingest
description: Como parsear exports financeiros brasileiros (extratos bancários OFX, planilhas CSV/XLSX do ERP interno e do Conta Azul) lidando com formatação BR — valores em R$ com vírgula decimal, datas dd/mm/aaaa, encoding Latin-1/UTF-8 misto. Use ao normalizar arquivos financeiros brutos em lançamentos estruturados.
---

# Parsing de exports financeiros brasileiros

## Quando usar

Sempre que for ler um arquivo bruto de `financial-analysis/inputs/` (CSV, XLSX ou OFX) e transformá-lo em lançamentos estruturados. Usado pelo agente `financial-data-ingestor`.

## Ferramenta

`financial-analysis/scripts/parse_exports.js` (Node — `xlsx`/SheetJS para tabelas, parser OFX próprio via regex, sem dependência de Python). Rode `npm install` em `financial-analysis/` uma vez antes do primeiro uso.

```bash
node financial-analysis/scripts/parse_exports.js ofx <arquivo.ofx>
node financial-analysis/scripts/parse_exports.js table <arquivo.csv|arquivo.xlsx> [--sheet=Nome]
node financial-analysis/scripts/parse_exports.js normalize-valor "R$ 1.234,56"
node financial-analysis/scripts/parse_exports.js normalize-data "05/07/2026"
```

## Formatos de arquivo

### OFX (extratos bancários)

- `parse_exports.js ofx <arquivo>` já devolve lançamentos totalmente normalizados (`data`, `descricao`, `valor`, `tipo`, `origem`, `arquivo_fonte`) — o schema `<STMTTRN>` do OFX é fixo, então essa etapa é 100% mecânica, sem ambiguidade.
- `valor` negativo no OFX vira `tipo: "saida"`; positivo vira `"entrada"`.
- O script lê o arquivo como `latin1` — cobre o encoding `ISO-8859-1` comum em OFX de bancos brasileiros.

### CSV / XLSX (ERP, Conta Azul, planilhas de faturamento/comissões)

- `parse_exports.js table <arquivo>` devolve as linhas brutas (`linhas: [{cabeçalho: valor}]`) e a lista de planilhas disponíveis — a extração de arquivo é mecânica, mas mapear qual coluna é data/valor/descrição varia entre ERP, Conta Azul e planilhas manuais, então **essa parte é julgamento do agente**, não do script.
- Depois de identificar a coluna certa, use `normalize-valor` (remove `"R$"`, separador de milhar `.`, troca `,` decimal por `.`) e `normalize-data` (converte `dd/mm/aaaa` → `aaaa-mm-dd`) para não fazer essa conversão "de cabeça" — nunca assuma formato americano `mm/dd/aaaa`.
- A primeira linha nem sempre é o cabeçalho real (algumas planilhas do ERP têm 1-2 linhas de título antes da tabela) — inspecione as primeiras linhas do resultado de `table` antes de decidir qual é a linha de cabeçalho.

## Regras gerais

- Nunca assuma um formato de coluna fixo entre arquivos de origens diferentes (ERP ≠ Conta Azul ≠ banco) — detecte colunas por nome (case-insensitive, ignorando acentos) antes de indexar por posição.
- Uma linha que não tem valor ou data válidos deve ser descartada e contabilizada como erro — nunca preenchida com `0` ou data de hoje.
- Preserve o nome do arquivo de origem em cada lançamento (`arquivo_fonte`) para rastreabilidade.

