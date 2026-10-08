# Plano estrutural — Plataforma de Processos para BPO Financeiro e RH

> Documento de arquitetura funcional. **Nada é implementado a partir daqui sem aprovação ponto a ponto.**
> Base: engenharia reversa dos fundamentos do Gestta Processos + o que já existe neste repositório.

> **Em revisão / aprovado:** a primeira fatia — atividades recorrentes, caso de referência
> Conciliação Bancária — foi recortada e detalhada em
> [spec-atividades-recorrentes.md](spec-atividades-recorrentes.md).
> Cobre os blocos 0 (parcial), 1 (parcial), 2, 3 e 4.

---

## Parte 1 — Fundamentos do Gestta Processos (análise)

### 1.1 O que o Gestta realmente é

O Gestta não é um "gerenciador de tarefas com clientes". Ele é um **motor de obrigações periódicas
com prova de entrega**. A diferença é estrutural: num Trello/Asana alguém precisa *lembrar* de criar
o card; no Gestta a obrigação **nasce sozinha** a partir de uma regra de calendário ligada ao contrato
do cliente, e só morre quando existe evidência de que foi entregue.

Todo o resto do produto (dashboards, relatórios, portal, apontamento de tempo) é consequência disso.

### 1.2 Os 8 conceitos-núcleo

| # | Conceito | O que é | Por que existe |
|---|----------|---------|----------------|
| 1 | **Cliente como eixo** | Toda tarefa, documento, prazo e certidão pendura em um cliente | Permite responder "o que está pendente na Empresa X?" em uma consulta |
| 2 | **Catálogo de serviços** | Biblioteca de obrigações cadastráveis (DAS, PIS, DARF…) com periodicidade | Separa *o que a empresa sabe fazer* de *o que foi contratado por cada cliente* |
| 3 | **Tarefa recorrente** | Obrigação periódica gerada automaticamente por regra de calendário | Elimina o esquecimento — a causa nº 1 de multa |
| 4 | **Ordem de serviço** | Demanda pontual, criada a partir de template, pelo escritório ou pelo cliente | Cobre o que não é periódico sem poluir o calendário |
| 5 | **Prazo duplo (legal × meta)** | Data legal = vencimento legislativo; data meta = prazo interno, sempre antes | Cria margem de segurança gerenciável e transforma atraso interno em alerta, não em multa |
| 6 | **Checklist** | Etapas marcáveis dentro de uma tarefa | Padroniza execução e torna o meio-do-caminho visível |
| 7 | **Fluxo entre departamentos** | Conclusão de uma etapa empurra a tarefa para o próximo departamento, com histórico | Transforma processo tácito em processo executável e auditável |
| 8 | **Entrega com evidência** | Tarefa "com documento" só fecha com arquivo anexado e cliente notificado | O anexo é a prova de entrega — vira defesa em disputa |

### 1.3 Funcionalidades de suporte (o que orbita o núcleo)

- **Apontamento de tempo** — registro de horas por tarefa. Alimenta duas perguntas de gestão:
  *quanto tempo cada cliente consome* e *qual o tempo médio por tipo de entrega*. É a base de
  precificação e de decisão de demissão de cliente não rentável.
- **Express (conclusão em lote)** — o sistema lê CNPJ + competência do arquivo, casa com a tarefa
  correspondente e conclui várias de uma vez. Ataca o gargalo real: subir 300 guias por mês.
- **Portal e app do cliente** — o cliente envia documento, consulta guias, acompanha status.
  O cliente vira participante do fluxo, não espectador.
- **Controle de certidões e certificados** — cadastros com validade e alerta de vencimento
  (certificado digital vencido para o escritório inteiro).
- **Agrupadores** — segmentações transversais de clientes/tarefas para filtro e relatório.
- **Níveis de acesso em três camadas** — administrativo (visão total), gerencial (o departamento
  dele), operacional (as tarefas dele).
- **Integração com o sistema-fonte** — a atividade concluída no sistema contábil fecha a tarefa
  no Gestta automaticamente. Princípio: *não pedir ao usuário que informe duas vezes o mesmo fato*.
- **Notificação a cada conclusão** e **configuração de horário de acesso**.

### 1.4 Os princípios de design que vamos herdar

1. **A obrigação é gerada, não lembrada.**
2. **A tarefa é a unidade atômica de responsabilidade**: cliente + serviço + competência + responsável + prazo + status. Se não cabe nessa tupla, não é tarefa — é projeto ou é anotação.
3. **Todo estado é auditável**: quem fez, quando, o que mudou.
4. **A entrega precisa de evidência.**
5. **Medir para gerir**: tempo e volume por cliente e por colaborador.
6. **O cliente participa do fluxo.**

---

## Parte 2 — O que muda no BPO Financeiro e RH

O Gestta foi desenhado para contabilidade (ciclo **mensal**, prazo **legal**). Nosso domínio tem duas
diferenças que impactam a modelagem — e ignorá-las é o erro clássico de quem copia o Gestta.

### 2.1 BPO Financeiro: o ciclo é diário, não mensal

| Rotina | Frequência | Impacto no modelo |
|--------|-----------|-------------------|
| Contas a pagar / agendamento | Diária | Prazo precisa de **hora**, não só data (corte bancário às 14h/16h) |
| Contas a receber / baixa | Diária | Volume alto → precisa de ação em lote |
| Conciliação bancária | Diária/semanal | Tarefa gerada por *evento* (extrato importado), não por calendário |
| Emissão de NF | Sob demanda | Ordem de serviço disparada por solicitação do cliente |
| Fechamento financeiro + relatório gerencial/DRE | Mensal | Recorrente clássica, encaixa no modelo Gestta |
| Fluxo de caixa projetado | Semanal | Recorrente com periodicidade semanal |

**Consequência estrutural:** o motor de recorrência precisa suportar periodicidade **diária, semanal,
quinzenal, mensal, trimestral e anual** — e prazos com granularidade de hora. E precisa existir um
segundo gatilho, **por evento**, não só por calendário.

### 2.2 BPO RH/DP: o ciclo é por colaborador, não só por cliente

O Gestta tem um eixo (cliente). RH tem **dois** (cliente → colaborador). Admissão, rescisão, férias,
ASO e ponto pendem do colaborador, não da empresa.

| Rotina | Eixo | Frequência |
|--------|------|-----------|
| Admissão (documentos, exame, registro, eSocial) | Colaborador | Evento |
| Folha de pagamento | Cliente | Mensal |
| Férias (aviso, recibo, pagamento) | Colaborador | Por vigência individual |
| 13º (1ª e 2ª parcela) | Cliente | Anual (2 janelas) |
| Rescisão (TRCT, homologação, guias) | Colaborador | Evento |
| eSocial (eventos periódicos e não-periódicos) | Ambos | Mensal + evento |
| Ponto (fechamento, banco de horas) | Cliente | Mensal |
| Benefícios (VT/VR, plano) | Cliente | Mensal |
| ASO periódico / convenção coletiva | Colaborador / Cliente | Por vigência |

**Consequência estrutural:** a tarefa precisa de um vínculo **opcional** com colaborador
(`collaboratorUserId`), e o motor de recorrência precisa gerar tarefas **por vigência individual**
(férias vencendo, ASO vencendo), não só por calendário fixo.

### 2.3 O que já existe neste repositório (ponto de partida real)

Stack: **Next.js 16.2 (App Router) + React 19 + Prisma 6 + PostgreSQL/Supabase + NextAuth v5 +
Tailwind 4 + Zod 4**.

Já implementado em [prisma/schema.prisma](prisma/schema.prisma):

| Modelo existente | Reaproveitamento no plano |
|------------------|---------------------------|
| `Company` (cartão CNPJ completo) | Vira o **cliente** do BPO — já tem CNPJ, endereço, situação cadastral |
| `User` + `Role` (ADMIN, COMPANY_HR, COLLABORATOR, CLIENT) | Base de permissão — **precisa evoluir** (ver §3.0) |
| `Document` + `Signature` (assinatura manuscrita, IP, user-agent) | Vira a **evidência de entrega** do bloco 7 — já resolve o conceito nº 8 |
| `VacationRequest` | Primeiro caso real de **workflow com aprovação** — vira caso-teste do motor de fluxo |
| `BankAccount` | Insumo do BPO Financeiro (conciliação, pagamentos) |
| `ContaAzulIntegration` (OAuth, refresh token) | Primeira integração — modelo para as demais |

Rotas já existentes: `/admin`, `/portal-cliente`, `/portal-colaborador`, `/portal-rh`.
Ou seja: **os quatro personas do Gestta já estão separados por rota neste projeto.**

> ⚠️ **O que falta é exatamente o núcleo**: não existe `Task`, `Service`, `Recurrence`, `Workflow`,
> `TimeEntry` nem `Department`. O plano abaixo é sobre construir esse núcleo e pendurar o que já
> existe nele.

---

## Parte 3 — Plano estrutural, bloco a bloco

Cada bloco tem: **conceito → entidades → regras → telas → depende de**.

---

### Bloco 0 — Fundação: tenancy, papéis e auditoria

**Conceito.** Antes de qualquer tarefa existir, é preciso responder "quem enxerga o quê". O Gestta
usa 3 níveis; nós precisamos de 4 eixos: *organização* (nós, o BPO), *cliente* (empresa atendida),
*departamento* e *pessoa*.

**Entidades**
- `Department` — id, nome, cor, ativo. (Financeiro, DP/RH, Fiscal, Atendimento)
- `Team` / `DepartmentMember` — usuário ↔ departamento, com papel no departamento (gestor/operador)
- Evoluir `Role`: hoje é um enum de 4 valores misturando persona e permissão. Separar em
  **persona** (INTERNO / CLIENTE / COLABORADOR) + **nível** (ADMIN / GESTOR / OPERACIONAL).
- `AuditLog` — entidade, entidadeId, ação, autorId, diff (JSON), IP, timestamp
- `ClientAssignment` — quais usuários internos atendem quais clientes (carteira)

**Regras**
- Usuário CLIENTE só enxerga tarefas do próprio `companyId`.
- Usuário COLABORADOR só enxerga o que é dele (documentos, férias, ponto).
- GESTOR enxerga o próprio departamento em todos os clientes.
- ADMIN enxerga tudo.
- **Toda** mutação relevante grava `AuditLog`. Sem exceção — é o que sustenta o princípio nº 3.

**Telas.** Configurações → Departamentos, Equipes, Carteira de clientes, Log de auditoria.

**Depende de.** Nada. É o primeiro bloco.

---

### Bloco 1 — Cadastros base

**Conceito.** O `Company` atual descreve a empresa juridicamente, mas não descreve a **relação de
serviço**. Falta: o que foi contratado, quem é o contato, qual o regime, qual o dia de fechamento.

**Entidades**
- Estender `Company` com: `regimeTributario`, `diaFechamento`, `clientSince`, `status`
  (ATIVO/SUSPENSO/ENCERRADO), `responsavelInternoId`
- `Contact` — contatos do cliente (financeiro, RH, sócio) com e-mail, WhatsApp, papel
- `Tag` / `TagAssignment` — os **agrupadores** do Gestta. Transversal: cliente, tarefa, documento
- `Holiday` — feriados nacionais/estaduais/municipais (insumo do motor de recorrência)

**Regras**
- Cliente `SUSPENSO` não gera tarefas recorrentes novas, mas mantém as existentes visíveis.
- Encerramento de cliente exige tratamento das tarefas abertas (cancelar / concluir / transferir).

**Telas.** Já existe `/admin/empresas` — estender com abas: Dados, Contatos, Serviços contratados,
Tags, Equipe responsável.

**Depende de.** Bloco 0.

---

### Bloco 2 — Catálogo de serviços e templates de tarefa

**Conceito.** Separar **o que sabemos fazer** (catálogo, definido uma vez) de **o que cada cliente
contratou** (`ServiceContract`). É a separação que permite mudar a regra de um serviço e refletir
em 200 clientes.

**Entidades**
- `Service` — nome, departamento, natureza (RECORRENTE / SOB_DEMANDA), exige documento (bool),
  SLA padrão em dias, checklist padrão (JSON), descrição
- `ServiceContract` — `companyId` + `serviceId` + regra de recorrência + responsável padrão +
  prazo meta (offset em dias antes do legal) + ativo/inativo + vigência
- `ChecklistTemplateItem` — itens ordenados do checklist padrão do serviço

**Regras**
- Alterar o checklist do `Service` **não** altera tarefas já geradas (snapshot no momento da geração).
- Um cliente pode contratar o mesmo serviço duas vezes com regras diferentes (ex: dois CNPJs).

**Telas.** Configurações → Catálogo de serviços. Cliente → aba "Serviços contratados".

**Depende de.** Blocos 0 e 1.

---

### Bloco 3 — Motor de recorrência (o coração)

**Conceito.** É o bloco que faz a diferença entre "mais um Trello" e um Gestta. Um job gera as
tarefas do período a partir dos `ServiceContract` ativos.

**Entidades**
- `RecurrenceRule` — tipo (DIARIA / SEMANAL / QUINZENAL / MENSAL / TRIMESTRAL / ANUAL / EVENTO),
  dia base, hora limite, ajuste de dia não-útil (ANTECIPAR / POSTERGAR / MANTER), meses aplicáveis
- `GenerationRun` — log de cada execução do gerador (idempotência e rastreio)

**Regras**
- **Idempotência é obrigatória**: a chave `(serviceContractId, competência)` é única. Rodar o
  gerador duas vezes não pode duplicar tarefa.
- Geração antecipada configurável (ex: gerar as tarefas do mês seguinte no dia 25).
- Ajuste por feriado usando `Holiday` (bloco 1).
- Recorrência **por evento**: admissão criada → gera pacote de tarefas de admissão.
- Recorrência **por vigência**: férias vencendo em 60 dias → gera tarefa de programação.

**Telas.** Configurações → Motor de geração (histórico de execuções, geração manual, prévia).

**Depende de.** Blocos 1 e 2. **Bloco de maior risco técnico — merecerá spike próprio.**

---

### Bloco 4 — Tarefa (a unidade atômica)

**Conceito.** Tudo converge aqui. Uma tarefa é: *cliente + serviço + competência + responsável +
prazo legal + prazo meta + status*.

**Entidades**
- `Task` — companyId, serviceId, serviceContractId?, collaboratorUserId? (eixo RH),
  competencia (YYYY-MM ou data), `dueDateLegal`, `dueDateTarget`, `assigneeId`, `departmentId`,
  status, prioridade, origem (RECORRENTE / ORDEM_SERVICO / SOLICITACAO_CLIENTE / EVENTO),
  `workflowInstanceId?`, `completedAt`, `completedById`
- `TaskChecklistItem` — snapshot do template + estado marcado + quem marcou
- `TaskComment` — comentários internos e visíveis ao cliente (flag)
- `TaskAttachment` — liga `Task` ↔ `Document` (bloco 7)
- `TaskHistory` — transições de estado (alimenta o `AuditLog`)

**Máquina de estados**
```
PENDENTE → EM_ANDAMENTO → AGUARDANDO_CLIENTE ⇄ EM_ANDAMENTO
                        → EM_REVISAO → CONCLUIDA
                        → CANCELADA
```
- `ATRASADA` não é estado — é atributo derivado (`now > dueDateLegal && status != CONCLUIDA`).
  Mesma coisa para `EM_RISCO` (`now > dueDateTarget`). **Não persistir estado derivado.**

**Regras**
- Serviço com `exigeDocumento = true` não conclui sem anexo.
- `AGUARDANDO_CLIENTE` **pausa** a contagem de SLA interno (senão o indicador pune o time por
  culpa do cliente).
- Conclusão registra autor, timestamp e dispara notificação (bloco 10).

**Telas.** Lista de tarefas com filtros salvos (por cliente, departamento, responsável, período,
status, tag) · Visão calendário · Visão kanban por departamento · **Minhas tarefas** (a tela que o
operacional abre de manhã) · Detalhe da tarefa.

**Depende de.** Blocos 0–3.

---

### Bloco 5 — Ordens de serviço e solicitações do cliente

**Conceito.** Demanda que não está no calendário. Duas portas de entrada: interna (o time cria) e
externa (o cliente pede pelo portal).

**Entidades**
- `ServiceOrderTemplate` — modelo pré-cadastrado (nome, departamento, checklist, SLA, campos extras)
- `ServiceRequest` — solicitação do cliente: descrição, anexos, status (ABERTA / ACEITA /
  RECUSADA / CONVERTIDA), `taskId?` após conversão

**Regras**
- Solicitação aceita **vira** `Task` com origem `SOLICITACAO_CLIENTE` — não é uma entidade paralela.
- SLA de resposta à solicitação é separado do SLA de execução.
- Recusa exige justificativa e notifica o cliente.

**Telas.** Admin → Ordens de serviço (criar a partir de template) · Portal do cliente → "Solicitar
algo" + acompanhamento.

**Depende de.** Blocos 2 e 4.

---

### Bloco 6 — Fluxos entre departamentos

**Conceito.** Uma entrega que atravessa departamentos. Concluir a etapa do Financeiro empurra
automaticamente para o DP, que é notificado e recebe o histórico do que já foi feito.

**Entidades**
- `WorkflowTemplate` — nome, descrição, ativo
- `WorkflowStep` — ordem, departamento, serviço/ação, responsável padrão, SLA da etapa,
  condição de avanço (`AUTOMATICO` / `APROVACAO`)
- `WorkflowInstance` — instância viva ligada ao cliente/competência
- Etapas materializam-se como `Task` com `workflowInstanceId` preenchido

**Regras**
- Etapa N+1 só é criada quando N conclui (evita poluir a fila com tarefas não acionáveis).
- Etapa de aprovação pode **devolver** para a etapa anterior com justificativa.
- Cancelar a instância cancela as etapas abertas.
- **Caso-teste natural:** o `VacationRequest` já existente é um fluxo de 3 etapas
  (solicitação → aprovação RH → geração e assinatura de documento). Migrá-lo para o motor de
  workflow valida o motor contra um caso real em produção.

**Telas.** Configurações → Fluxos (editor de etapas) · Visão de fluxo dentro da tarefa (trilha).

**Depende de.** Bloco 4.

---

### Bloco 7 — Documentos e evidência de entrega

**Conceito.** Já 80% pronto no repositório. `Document` + `Signature` (com assinatura manuscrita, IP
e user-agent) resolve o conceito nº 8. Falta ligar ao núcleo de tarefas.

**Entidades**
- Estender `Document` com: `companyId` (hoje só tem dono usuário), `taskId?`, `category`,
  `visibleToClient`, `validUntil?`
- `DocumentRequest` — pedido de documento ao cliente/colaborador, com prazo e lembrete

**Regras**
- Documento anexado a tarefa "com documento" satisfaz a condição de conclusão.
- Documento com `visibleToClient` aparece no portal automaticamente.
- Assinatura pendente gera lembrete escalonado.

**Telas.** Reaproveitar `/portal-cliente/documentos`, `/portal-colaborador/documentos`,
`/portal-rh/documentos`. Adicionar filtro por tarefa e por competência.

**Depende de.** Bloco 4. **Menor esforço relativo — já existe base sólida.**

---

### Bloco 8 — Apontamento de tempo e produtividade

**Conceito.** Sem isso não há resposta para "esse cliente dá lucro?". É o bloco que transforma o
sistema de operacional em gerencial.

**Entidades**
- `TimeEntry` — taskId, userId, início, fim, duração, manual/cronômetro, observação
- Campo `estimatedMinutes` no `Service` (baseline para comparação)

**Regras**
- Cronômetro na tarefa + lançamento manual retroativo (com limite de dias, configurável).
- Um usuário não pode ter dois cronômetros ativos.
- Agregações: tempo por cliente/mês, tempo médio por serviço, tempo por colaborador,
  **tempo × valor do contrato = margem por cliente**.

**Telas.** Botão de cronômetro na tarefa · Meu timesheet · Relatório de rentabilidade por cliente.

**Depende de.** Bloco 4.

---

### Bloco 9 — Portal do cliente

**Conceito.** O cliente vira participante. Já existe `/portal-cliente` com documentos — falta o
resto do ciclo.

**Escopo**
- Painel: o que está pendente **comigo** (cliente), o que está em andamento com o BPO, o que foi
  entregue no mês
- Envio de documentos solicitados (`DocumentRequest`)
- Abertura de solicitação (bloco 5)
- Aprovações (ex: aprovar lote de pagamentos antes da execução — crítico em BPO Financeiro)
- Histórico de entregas com download

**Regras**
- O cliente **nunca** vê comentário interno, apontamento de tempo ou tarefa de outro cliente.
- Toda ação do cliente gera `AuditLog` (aprovação de pagamento é ato com consequência financeira).

**Depende de.** Blocos 4, 5, 7.

---

### Bloco 10 — Notificações e comunicação

**Entidades**
- `NotificationTemplate` — evento, canal, assunto, corpo (com variáveis)
- `Notification` — destinatário, canal, status (PENDENTE/ENVIADA/FALHA), payload, tentativas
- `NotificationPreference` — por usuário e por evento

**Canais.** E-mail (`nodemailer` já instalado) · in-app · WhatsApp (campo `whatsapp` já existe no
`User` — integração futura).

**Eventos.** Tarefa atribuída · prazo meta atingido · prazo legal em D-1 · tarefa concluída ·
documento aguardando assinatura · solicitação respondida · certidão vencendo.

**Regras**
- **Digest diário** por padrão, não notificação por evento — senão o time desliga tudo na 2ª semana.
- Fila com retry; falha de envio não pode derrubar a transação de negócio.

**Depende de.** Bloco 4.

---

### Bloco 11 — Controle de vigências (certidões, certificados, contratos)

**Conceito.** Qualquer coisa com data de validade que, vencida, para a operação.

**Entidades**
- `Validity` — companyId?, collaboratorId?, tipo (CND / CERTIFICADO_DIGITAL / PROCURACAO /
  CONTRATO / ASO / CONVENCAO_COLETIVA), número, emissão, validade, `documentId?`, responsável

**Regras**
- Alerta em D-60 / D-30 / D-7 (configurável por tipo).
- Vencimento **gera tarefa automática** de renovação (integra com o bloco 3, gatilho por vigência).

**Depende de.** Blocos 3, 7, 10.

---

### Bloco 12 — Dashboards e relatórios

**Por persona:**

| Persona | Perguntas que o painel responde |
|---------|--------------------------------|
| Operacional | O que eu preciso entregar hoje? O que está atrasado comigo? |
| Gestor de departamento | Meu departamento está no prazo? Quem está sobrecarregado? Qual cliente está travando? |
| Administrativo | Qual a taxa de entrega no prazo? Qual cliente consome mais? Qual serviço estoura o SLA? |
| Cliente | O que falta de mim? O que já foi entregue? |

**Relatórios.** Produtividade por colaborador · Tarefas atrasadas por cliente/departamento ·
Tempo por cliente · Aderência a SLA por serviço · Pendências do cliente · Volume por competência.

**Regras.** Exportação CSV/PDF em todos. Filtros persistentes por usuário.

**Depende de.** Blocos 4 e 8.

---

### Bloco 13 — Integrações

- **Conta Azul** — já existe (`ContaAzulIntegration`, OAuth com refresh). Evoluir para
  **fechar tarefa automaticamente** quando o lançamento correspondente é feito lá. Aplica o
  princípio nº "não informar duas vezes".
- **Extrato bancário (OFX/CNAB/Open Finance)** — dispara tarefa de conciliação por evento.
- **Folha / eSocial** — leitura de status de envio para fechar tarefas de DP.
- **WhatsApp Business API** — canal de notificação e recebimento de documento.
- **Conclusão em lote tipo "Express"** — leitura de CNPJ + competência do PDF para casar arquivo
  com tarefa. **Alto valor, alta complexidade — fase 3.**

**Regras.** Toda integração isolada atrás de uma interface própria em `src/lib/integracoes/`,
seguindo o padrão já usado em [src/lib/conta-azul.ts](src/lib/conta-azul.ts). Token nunca em log.

---

### Bloco 14 — SLA, governança e configurações

- SLA por serviço e por cliente (contrato pode ter SLA diferenciado)
- Política de escalonamento (atrasou → notifica gestor → notifica admin)
- Horário de acesso configurável (o Gestta tem; avaliar necessidade real antes de construir)
- Feriados, calendário de competências, política de retenção de documentos
- LGPD: base legal, prazo de retenção, direito de exclusão — **relevante porque tratamos dado de
  colaborador de terceiros** (CPF, salário, ASO)

---

## Parte 4 — Modelo de dados consolidado (novo)

Entidades a criar, agrupadas por bloco:

```
Bloco 0  Department · DepartmentMember · ClientAssignment · AuditLog
Bloco 1  Contact · Tag · TagAssignment · Holiday        (+ estender Company)
Bloco 2  Service · ServiceContract · ChecklistTemplateItem
Bloco 3  RecurrenceRule · GenerationRun
Bloco 4  Task · TaskChecklistItem · TaskComment · TaskAttachment · TaskHistory
Bloco 5  ServiceOrderTemplate · ServiceRequest
Bloco 6  WorkflowTemplate · WorkflowStep · WorkflowInstance
Bloco 7  DocumentRequest                                 (+ estender Document)
Bloco 8  TimeEntry                                       (+ estender Service)
Bloco 10 NotificationTemplate · Notification · NotificationPreference
Bloco 11 Validity
```

**Reaproveitados sem reescrita:** `Company`, `User`, `Document`, `Signature`, `BankAccount`,
`ContaAzulIntegration`.
**Migrado para o novo motor:** `VacationRequest` → `WorkflowInstance` + `Task` (bloco 6).

---

## Parte 5 — Faseamento sugerido

| Fase | Blocos | Entrega | Critério de pronto |
|------|--------|---------|--------------------|
| **F1 — Núcleo** | 0, 1, 2, 4 | Tarefas manuais com cliente, serviço, prazo duplo, checklist, responsável | Um mês de operação real rodando manualmente no sistema |
| **F2 — Automação** | 3, 7, 10 | Motor de recorrência + evidência + notificação | Nenhuma obrigação mensal criada à mão |
| **F3 — Processo** | 5, 6, 9 | Ordens de serviço, fluxos entre departamentos, portal ativo | `VacationRequest` migrado para o motor de fluxo |
| **F4 — Gestão** | 8, 12, 11 | Tempo, dashboards, vigências | Relatório de margem por cliente confiável |
| **F5 — Escala** | 13, 14 | Integrações, Express, SLA, governança | Conta Azul fechando tarefa sozinha |

**Recomendação forte:** não pular a F1. A tentação é construir o motor de recorrência primeiro
porque é o mais interessante — mas gerar automaticamente tarefas cujo formato ainda não foi
validado na operação real multiplica o retrabalho por 200 clientes.

---

## Parte 6 — Riscos identificados

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Motor de recorrência duplicar tarefas | Alto — perda de confiança imediata | Chave única `(serviceContractId, competência)` + `GenerationRun` idempotente |
| Notificação excessiva | Alto — time desliga tudo, sistema vira inútil | Digest diário como padrão desde o dia 1 |
| Modelar RH só com eixo cliente | Alto — retrabalho estrutural | `collaboratorUserId` opcional no `Task` desde a F1 |
| Prazo só com data (sem hora) | Médio — BPO Financeiro tem corte bancário | `DateTime` com hora nos campos de prazo desde a F1 |
| Estado derivado persistido (`ATRASADA`) | Médio — dessincroniza | Calcular em query/view, nunca gravar |
| Cliente enxergar dado interno | **Crítico** — vazamento entre clientes | Filtro por `companyId` em camada de dados, testado; nunca só na UI |
| Reescrever o que já existe | Médio — desperdício | `Document`/`Signature`/`Company` são reaproveitados, não refeitos |

---

## Parte 7 — Skills recomendadas (`/find-skills`)

Pesquisa feita no registry `skills.sh`, filtrando por instalações e reputação da fonte.

### Recomendadas — instalar

| Skill | Fonte | Instalações | Por quê |
|-------|-------|-------------|---------|
| `prisma-database-setup` | **prisma/skills** (oficial) | 120.4K | Blocos 0–11 são majoritariamente modelagem Prisma. Fonte oficial. |
| `prisma-cli` | **prisma/skills** (oficial) | 117.7K | Migrations serão constantes; o repo já teve problema de env loading do Prisma CLI (commit `6260a8e`) |
| `vercel-react-best-practices` | **vercel-labs/agent-skills** (oficial) | 607.5K | React 19 + Server Components; a UI de tarefas é a parte mais pesada |
| `web-design-guidelines` | **vercel-labs/agent-skills** (oficial) | 517.3K | Complementa o `design-taste-frontend` já instalado |

```bash
npx skills add prisma/skills@prisma-database-setup -g -y
```

```bash
npx skills add prisma/skills@prisma-cli -g -y
```

```bash
npx skills add vercel-labs/agent-skills@vercel-react-best-practices -g -y
```

```bash
npx skills add vercel-labs/agent-skills@web-design-guidelines -g -y
```

### Não recomendadas — e o motivo

- **Skills de Next.js da comunidade** (`wshobson/agents@nextjs-app-router-patterns`, 26.4K;
  `mindrally/skills@nextjs-react-typescript`, 4.5K). O [AGENTS.md](AGENTS.md) deste projeto é
  explícito: *esta versão do Next.js tem breaking changes; leia `node_modules/next/dist/docs/`
  antes de escrever código*. Uma skill genérica treinada em Next.js 14/15 **contradiz** essa
  instrução e vai gerar código com APIs antigas. A fonte da verdade aqui é o `node_modules`.
- **Skills de multi-tenant** — a melhor tem 134 instalações; nenhuma passa do critério de
  qualidade da própria `find-skills` (preferir 1K+). O padrão de tenancy aqui é simples
  (filtro por `companyId`) e não justifica dependência externa.
- **Skills de PRD/planejamento** — todas abaixo de 50 instalações. Este documento já cumpre o papel.

### Já disponíveis neste ambiente (não precisa instalar)

`design-taste-frontend` e `frontend-design` (UI) · `financial-statements`, `reconciliation`,
`variance-analysis`, `close-management` do plugin **finance** — úteis quando formos modelar as
rotinas de fechamento do BPO Financeiro (blocos 2 e 12).

---

## Fontes

- [Gestta Processos — e-book oficial (Domínio Atendimento)](https://suporte.dominioatendimento.com/ctsfiles/ebook_gestta_processos_ok1.pdf?id=9420151&ds=centralSolucao)
- [Tudo sobre o Gestta — gestta.com.br](https://www.gestta.com.br/tudo-sobre-o-gestta/)
- [Gestta: o que é, como funciona — Anderson Hernandes](https://andersonhernandes.com.br/gesta-o-que-e-como-funciona/)
- [6 recursos do Gestta que tornam seu escritório produtivo](https://www.gestta.com.br/6-recursos-do-gestta-que-tornam-seu-escritorio-produtivo/)
- [Tarefas operacionais que o Gestta automatiza](https://www.gestta.com.br/tarefas-operacionais-que-o-gestta-pode-automatizar/)
- [Registro de skills — skills.sh](https://skills.sh/)
