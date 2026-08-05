---
name: financial-categorization-rules
description: Taxonomia de categorias e subcategorias financeiras específica deste BPO Financeiro e RH, usada para classificar lançamentos normalizados (receita, folha, comissões, impostos, despesas). Use ao categorizar lançamentos financeiros antes do cálculo de KPIs.
---

# Taxonomia financeira do BPO Financeiro e RH

## Quando usar

Ao classificar cada lançamento normalizado (ver `financial-data-ingest`) em uma categoria e subcategoria. Usado pelo agente `financial-categorizer`. Baseado no diagnóstico de negócio em `Briefing BPO Financeiro e RH.md`.

## Categorias

### `receita_operacional`
Faturamento dos clientes atendidos pelo BPO.
- `mensalidade_bpo` — cobrança recorrente de contrato de BPO.
- `servico_avulso` — cobrança pontual fora do contrato mensal.
- `outros_receita` — receita não classificável nas anteriores.

### `folha_pessoal`
Custos de folha de pagamento e RH internos.
- `salarios` — pagamento de salários da equipe interna.
- `beneficios` — vale-transporte, vale-refeição, plano de saúde.
- `encargos` — INSS, FGTS e demais encargos trabalhistas.
- `rescisao` — pagamentos de rescisão/aviso prévio.

### `comissao`
Comissões pagas ou a pagar — a frente citada no briefing como manual e demorada.
- `comissao_vendas` — comissão sobre vendas/contratos fechados.
- `comissao_recorrente` — comissão sobre carteira/mensalidades recorrentes.

### `imposto`
Tributos e obrigações fiscais da própria empresa (não dos clientes do BPO).
- `imposto_federal` — IRPJ, CSLL, PIS, COFINS.
- `imposto_municipal` — ISS.
- `outros_tributos` — taxas e tributos não classificados.

### `despesa_fixa`
Custos recorrentes independentes de volume.
- `aluguel_estrutura` — aluguel, condomínio, infraestrutura física.
- `sistemas_assinaturas` — softwares e assinaturas pagas pela própria empresa (não o ERP/Conta Azul dos clientes, que é custeado por eles — ver briefing).
- `utilidades` — água, luz, internet, telefonia.

### `despesa_variavel`
Custos que variam com volume de operação.
- `marketing` — divulgação, anúncios, materiais.
- `viagens_deslocamento` — deslocamento e viagens a trabalho.
- `outros_variavel` — despesa variável não classificada.

### `transferencia`
Movimentações entre contas próprias, sem efeito de receita/despesa real.
- `transferencia_interna` — entre contas da própria empresa.
- `aporte_socio` — aporte ou retirada de sócio.

### `outros`
Qualquer lançamento que não se encaixe com confiança em nenhuma categoria acima. Nunca force uma categorização incerta — prefira `outros` a um encaixe errado.

## Regras de classificação

- Use a descrição do lançamento, o valor e a origem (`banco`, `erp`, `conta_azul`, `boleto`) como sinais combinados — não decida só pelo texto da descrição.
- Lançamentos de entrada (`tipo: "entrada"`) só podem cair em `receita_operacional`, `transferencia` ou `outros` — nunca em categorias de despesa.
- Lançamentos de saída (`tipo: "saida"`) nunca caem em `receita_operacional`.
- Mantenha a mesma categoria para descrições recorrentes idênticas entre rodadas diferentes (consistência mês a mês é um requisito do squad, ver `Auditoria BPO - Análises de Demonstrativos/CLAUDE.md`).
