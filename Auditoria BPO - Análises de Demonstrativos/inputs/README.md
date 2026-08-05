# inputs/

Solte aqui os exports manuais do ERP interno e do Conta Azul. O `financial-data-ingestor` lê tudo desta pasta a cada rodada.

| Subpasta | O que colocar | Formatos aceitos |
|---|---|---|
| `bancario/` | Extratos bancários exportados do internet banking | `.ofx`, `.csv` |
| `faturamento/` | Faturamento/receita dos clientes do BPO (ERP ou Conta Azul) | `.csv`, `.xlsx` |
| `comissoes/` | Planilha de comissões do mês | `.csv`, `.xlsx` |
| `boletos/` | Boletos emitidos/recebidos, comprovantes de PIX | `.csv`, `.xlsx` |

Estes arquivos nunca são versionados no git (ver `.gitignore` na raiz) — contêm dados financeiros sensíveis.
