# Modelo de Previsão de Faturamento

Planilha-modelo (`previsao_faturamento.xlsx`) para projetar faturamento dos próximos 12 meses a partir do histórico mensal.

## Abas

- **Instruções** — como preencher o modelo e legenda de cores (azul = célula de entrada, preto = fórmula, fundo amarelo = premissa-chave).
- **Histórico** — até 24 meses de faturamento real (data + valor). Hoje só tem a linha de exemplo (mês 1, R$ 50.000) — falta preencher com dados reais.
- **Premissas** — taxa de crescimento mensal (calculada automaticamente ou manual) e opção de aplicar sazonalidade (SIM/NÃO), com índice sazonal por mês.
- **Previsão 12 Meses** — resultado calculado automaticamente a partir do histórico e das premissas; nada precisa ser preenchido nessa aba.

## Metodologia

- **Tendência**: taxa de crescimento média mensal observada no histórico, aplicada de forma composta a partir do último mês real.
- **Sazonalidade** (opcional): índice por mês = média do faturamento desse mês no histórico ÷ média mensal geral; multiplica a previsão de tendência.
- Quanto mais meses de histórico (ideal 24, mínimo 12), mais confiável o índice de sazonalidade.

## Status atual

Modelo ainda não populado com dados reais — contém apenas a linha de exemplo. Precisa do histórico real de faturamento para gerar uma previsão válida.

## Relacionados

- [[Imersão IA Index]]
