# Prioridades das Automações

Ordem sugerida de execução das automações do [[Briefing BPO Financeiro e RH]], considerando esforço de implementação, dependências técnicas (login, permissões, integrações externas) e o tempo que cada tarefa consome hoje.

## Ordem sugerida

1. **Automação da planilha de comissões** — mensal, 3 a 5 dias de trabalho. Complexidade baixa/média (regras já conhecidas, sem necessidade de portal ou login). 1ª — começar aqui.
2. **Controle de tarefas / checklist** (demandas recorrentes e normais) — contínuo/diário. Complexidade média (checklist e atribuição automática; WhatsApp aumenta a complexidade). 2ª — em seguida.
3. **Portal de documentos do funcionário** (admissão, rescisão, advertência, holerite com assinatura digital) — hoje feito manualmente, com baixa adesão de assinatura. Complexidade alta (login, permissões por perfil, validação por código, assinatura digital). 3ª — projeto maior.
4. **Conciliação bancária** — recorrente, ainda não detalhada em volume/tempo. Prioridade emocional alta, mas precisa de mais discovery (bancos, formatos de extrato, regras) antes de entrar na fila.

## Por que essa ordem

- **Planilha de comissões primeiro**: as regras de cálculo já são conhecidas, não depende de portal, login ou integração externa — é a automação mais rápida de entregar e libera de 3 a 5 dias por mês.
- **Controle de tarefas em seguida**: estrutura de checklist e atribuição automática tem escopo claro (inspirado no Onvio); a integração com WhatsApp pode entrar em uma segunda fase dentro dessa mesma frente.
- **Portal de documentos depois**: exige mais estrutura de segurança (login por perfil, validação por código, assinatura digital dos holerites) — maior impacto, porém maior complexidade e tempo de construção.
- **Conciliação bancária precisa de mais discovery**: foi apontada como a maior dor pessoal do gestor, mas ainda falta detalhar volume, bancos envolvidos e regras — recomenda-se um levantamento rápido antes de posicioná-la na fila.

## Relacionados

- [[Briefing BPO Financeiro e RH]]
- [[Imersão IA Index]]
