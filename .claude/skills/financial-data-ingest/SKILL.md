---
name: financial-data-ingest
description: Como parsear exports financeiros brasileiros (extratos bancários OFX, planilhas CSV/XLSX do ERP interno e do Conta Azul) lidando com formatação BR — valores em R$ com vírgula decimal, datas dd/mm/aaaa, encoding Latin-1/UTF-8 misto. Use ao normalizar arquivos financeiros brutos em lançamentos estruturados.
---

# Parsing de exports financeiros brasileiros

## Quando usar

Sempre que for ler um arquivo bruto de `financial-analysis/inputs/` (CSV, XLSX ou OFX) e transformá-lo em lançamentos estruturados. Usado pelo agente `financial-data-ingestor`.

## Formatos de arquivo

### OFX (extratos bancários)

- Use a biblioteca `ofxparse` (Python). Cada `transaction` tem `date`, `amount`, `memo`/`payee`.
- `amount` negativo = saída, positivo = entrada.
- Bancos brasileiros às vezes exportam OFX com encoding `ISO-8859-1` — tente `utf-8` primeiro, faça fallback para `latin-1` se decodificar falhar ou gerar caracteres inválidos.

### CSV / XLSX (ERP, Conta Azul, planilhas de faturamento/comissões)

- Use `pandas.read_csv` / `pandas.read_excel` (`openpyxl` como engine para `.xlsx`).
- Valores monetários costumam vir como string `"R$ 1.234,56"` — remover `"R$"`, trocar `.` (separador de milhar) por nada e `,` (separador decimal) por `.`, depois converter para `float`.
- Datas costumam vir como `dd/mm/aaaa` — parsear com `dayfirst=True`, nunca assumir formato americano `mm/dd/aaaa`.
- A primeira linha nem sempre é o cabeçalho real (algumas planilhas do ERP têm 1-2 linhas de título antes da tabela) — inspecione as primeiras linhas antes de fixar `header=0`.

## Regras gerais

- Nunca assuma um formato de coluna fixo entre arquivos de origens diferentes (ERP ≠ Conta Azul ≠ banco) — detecte colunas por nome (case-insensitive, ignorando acentos) antes de indexar por posição.
- Uma linha que não tem valor ou data válidos deve ser descartada e contabilizada como erro — nunca preenchida com `0` ou data de hoje.
- Preserve o nome do arquivo de origem em cada lançamento (`arquivo_fonte`) para rastreabilidade.

## Exemplo de normalização de valor

```python
def parse_valor_br(valor_str: str) -> float:
    limpo = valor_str.replace("R$", "").strip()
    limpo = limpo.replace(".", "").replace(",", ".")
    return float(limpo)
```
