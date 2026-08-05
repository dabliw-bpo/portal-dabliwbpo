# inputs/

Solte aqui os exports manuais dos sistemas. Os arquivos nunca são versionados no git (ver `.gitignore` na raiz) — contêm dados financeiros sensíveis.

| Subpasta | O que colocar | Formatos aceitos |
|---|---|---|
| `relatorios/` | Relatórios PDF do ERP de transportes (Lucratividade de Viagens, Despesas Gerais) | `.pdf` |
| `bancario/` | Extratos bancários exportados do internet banking | `.ofx`, `.csv` |
| `faturamento/` | Faturamento/receita dos clientes do BPO (ERP ou Conta Azul) | `.csv`, `.xlsx` |
| `comissoes/` | Planilha de comissões do mês | `.csv`, `.xlsx` |
| `boletos/` | Boletos emitidos/recebidos, comprovantes de PIX | `.csv`, `.xlsx` |

## Sobre `relatorios/` (fluxo já testado)

É o único fluxo rodado ponta a ponta até hoje. Os scripts aceitam qualquer caminho, então
não é obrigatório copiar os PDFs para cá — evita duplicar dado sensível no disco. Ver
`../CLAUDE.md` § "Fluxo A" para os comandos.

Layouts de relatório reconhecidos (detectados pelo cabeçalho interno do PDF):

- `RelViagensLucr` — "Relatório de Lucratividade de Viagens por Filial"
- `RelDespesasGerais` — "Relatório de Despesas Gerais"

Um PDF com outro layout devolve `relatorio: "desconhecido"` em vez de números errados.
