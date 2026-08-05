# Auditoria BPO - Análises de Demonstrativos

Squad multi-agente para consolidar exports manuais do ERP interno e do Conta Azul em um dashboard financeiro recorrente. Escopado a esta pasta — não faz parte do app Next.js na raiz do repositório. Centraliza também o diagnóstico de negócio e os modelos que originaram este squad (briefing, prioridades de automação, modelo de previsão de faturamento). Gerado pela skill `mestre-squad-builder`.

## Papel do orquestrador

Você (o orquestrador) **não executa** as etapas de ingestão, categorização, cálculo ou geração de dashboard diretamente. Você:

1. Detecta novos arquivos em `inputs/` (ou recebe um pedido explícito de rodar a análise).
2. Delega ao pipeline de agentes na ordem definida em "Topologia".
3. Repassa a saída estruturada (JSON) de um agente como entrada do próximo — nunca reinterpreta os números no meio do caminho.
4. Sintetiza o resultado final para o usuário (onde o dashboard foi salvo, principais números, alertas).

## Filosofia da experiência

- `creative_philosophy`: análise-first — todo output parte de dados normalizados e auditáveis, nunca de estimativas soltas.
- `output_philosophy`: precisão numérica rastreável à fonte. Nenhum agente "estima de cabeça" — parsing e cálculos passam por `scripts/parse_exports.js` e `scripts/calculate_metrics.js` (Node — não há Python instalado neste ambiente).
- `experience_mode`: visual contemporâneo e limpo (referência Onvio/Conta Azul), leitura executiva rápida com drill-down disponível.
- `communication_style`: direto, em PT-BR, orientado a números e ação (o que mudou, o que requer atenção).
- `density_profile`: dashboard denso em KPIs na dobra superior, detalhamento por categoria abaixo.
- `consistency_rules`: mesma paleta de cores, mesmo formato de data (dd/mm/aaaa) e mesma taxonomia de categorias (`.claude/skills/financial-categorization-rules/`) entre rodadas.

## Princípios invioláveis

1. **Orquestrador não executa.** Delega, coordena, sintetiza.
2. **Sub-agentes têm escopo único** (ver tabela abaixo).
3. **Saída sempre estruturada** — cada agente devolve JSON com schema estrito, nunca texto solto.
4. **Secrets nunca globais.** Este squad hoje não usa nenhuma API externa (input é 100% export manual) — se uma integração automática com Conta Azul/ERP for adicionada depois, a chave vai em `.env` dentro desta pasta, nunca hardcoded, nunca no `.env.local` do app Next.js.
5. **Dados financeiros nunca vão para o git.** `inputs/` e `outputs/` estão no `.gitignore` da raiz — são exports sensíveis (extratos, faturamento, comissões).
6. **Isolamento do app principal.** Este squad não lê nem escreve em `src/`, `prisma/`, `supabase/` ou qualquer arquivo do app Next.js na raiz. Se uma integração futura precisar disso, é uma decisão explícita do usuário, não automática.

## Agentes

Definidos em `.claude/agents/` (escopados a esta pasta — convenção de skills/agents por diretório do Claude Code):

| Agente | Escopo único | Input | Output |
|---|---|---|---|
| `financial-data-ingestor` | Ler e normalizar arquivos brutos de `inputs/` | CSV/XLSX/OFX | `outputs/normalized/{timestamp}.json` |
| `financial-categorizer` | Classificar lançamentos por categoria/subcategoria | JSON normalizado | `outputs/categorized/{timestamp}.json` |
| `financial-analyst` | Calcular KPIs via script determinístico | JSON categorizado | `outputs/metrics/{timestamp}.json` |
| `dashboard-builder` | Gerar dashboard HTML interativo | JSON de métricas | `outputs/dashboards/dashboard_{timestamp}.html` |
| `financial-insight-writer` | Escrever 3-6 bullets de insights/alertas | JSON de métricas | `outputs/insights/insight_{timestamp}.md` |

## Topologia

```
financial-data-ingestor
        │
        ▼
financial-categorizer
        │
        ▼
financial-analyst
        │
   ┌────┴────┐
   ▼         ▼
dashboard-  financial-
builder     insight-writer
```

Sequencial até `financial-analyst`; as duas últimas etapas rodam em paralelo (ambas consomem o mesmo JSON de métricas e não dependem uma da outra).

## Como rodar

Uma vez: `npm install` dentro desta pasta (instala `xlsx` e `pdf-parse`).

Há **dois fluxos**, e só o primeiro foi rodado ponta a ponta até hoje.

### Fluxo A — Relatórios PDF do ERP de transportes (testado)

Totalmente por script, sem subagentes. Foi o fluxo usado na análise da EGM
Transportes (jan–jun/2026), com os totais conferidos ao centavo contra os
totais impressos pelo próprio ERP.

```bash
node scripts/analyze_reports.js <lucratividade.pdf> <despesas.pdf> > outputs/metrics/metrics_<periodo>.json
node scripts/build_dashboard.js outputs/metrics/metrics_<periodo>.json outputs/dashboards/dashboard_<empresa>_<periodo>.html
```

Os scripts aceitam qualquer caminho — não é preciso copiar os PDFs para `inputs/`.

- `scripts/parse_pdf_reports.js` — extrai os totais oficiais dos dois layouts de relatório e roda conferências internas (as parcelas de receita têm de somar o Total Receitas; os itens de despesa têm de somar o Total Geral). Divergência vira `avisos_validacao`, não número errado.
- `scripts/analyze_reports.js` — classifica os itens de despesa e consolida. **É onde está o julgamento contábil** (constante `CLASSIFICACAO`): o que é dupla contagem com o custo de viagem, o que não é despesa de resultado. Item novo no plano de contas do ERP gera alerta em vez de entrar silenciosamente na conta errada.
- `scripts/build_dashboard.js` — gera o HTML autocontido (tema claro/escuro, paleta validada).

### Fluxo B — Exports CSV/XLSX/OFX via subagentes (nunca rodado)

O pipeline de 5 agentes descrito acima. Os scripts determinísticos que ele usa
(`parse_exports.js`, `calculate_metrics.js`) estão testados com dados de
exemplo, mas os agentes nunca processaram dados reais. Trate como não validado.

> **Aviso sobre a taxonomia.** `.claude/skills/financial-categorization-rules/`
> foi escrita para os livros do próprio BPO (mensalidade, folha, comissão) a
> partir do briefing — **não serve** para analisar o demonstrativo operacional de
> um cliente de transportes. O Fluxo A não a usa; usa a `CLASSIFICACAO` do
> `analyze_reports.js`. Se o Fluxo B for ativado para analisar clientes, essa
> skill precisa ser reescrita primeiro.

## Skills usadas pelo squad

- `.claude/skills/financial-data-ingest/` — como parsear exports financeiros brasileiros (R$, vírgula decimal, datas dd/mm/aaaa, encoding).
- `.claude/skills/financial-categorization-rules/` — taxonomia de categorias/subcategorias específica deste BPO.

## Documentos de diagnóstico

Também centralizados nesta pasta (contexto de negócio que originou o squad):

- `Briefing BPO Financeiro e RH.md` / `briefing_imersao_ia.docx` — diagnóstico original.
- `Prioridades das Automações.md` — ordem de prioridade das automações do BPO.
- `Modelo de Previsão de Faturamento.md` / `previsao_faturamento.xlsx` — modelo de projeção de faturamento (independente deste squad, mas mesma origem de diagnóstico).
- `Imersão IA Index.md` — índice desses documentos.

## Regra final

Nenhum agente inventa números. Se um arquivo em `inputs/` não puder ser parseado, o `financial-data-ingestor` reporta o erro no campo `resumo_ingestao.arquivos_com_erro` — o pipeline não continua com dados incompletos sem sinalizar isso no dashboard final.
