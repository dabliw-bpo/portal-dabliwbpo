# Spec — Atividades recorrentes (fatia R1–R5)

> Recorte executável do [plano estrutural](plano-plataforma-processos.md).
> Caso de referência: **Conciliação Bancária**.

## Decisões travadas

| # | Decisão | Consequência |
|---|---------|--------------|
| D1 | **1 tarefa por conta bancária** | Granularidade vira propriedade do **serviço** (`Service.scope`), não configuração por contrato |
| D2 | **Fila de execução primeiro** | Serviços e contratos entram por seed; telas de cadastro ficam para depois |
| D3 | **Criar `OPERADOR` e `GESTOR`** | `/admin` continua ADMIN-only; atividades ganham rota própria em `/atividades` |
| D4 | Gatilho só por **calendário** | Gatilho por evento ("extrato chegou") espera integração bancária |

### Estado: etapas 1 a 6 implementadas

Ver §6 para o que cada etapa entregou e §8 para os desvios que a implementação
impôs ao spec.

### Duas revisões ao plano original

1. **`RecurrenceRule` deixa de ser tabela.** Cada contrato tem exatamente uma regra — a tabela
   separada só adicionava join. Os campos vão para dentro de `ServiceContract`.
2. **`competencia: String` vira `periodStart`/`periodEnd: DateTime`.** Uma string que às vezes é
   `2026-08`, às vezes `2026-W32` e às vezes `2026-08-05` não ordena nem compara. O rótulo de
   exibição ("Ago/2026", "Semana de 03/08") é derivado na UI.

---

## 1. Modelo de dados

### 1.1 Papéis (altera enum existente)

```prisma
enum Role {
  ADMIN         // BPO — visão total
  GESTOR        // BPO — o departamento dele, em todos os clientes
  OPERADOR      // BPO — as tarefas dele
  COMPANY_HR    // cliente — RH da empresa atendida
  COLLABORATOR  // colaborador da empresa atendida
  CLIENT        // cliente — visão externa
}
```

> `homePathForRole()` em [src/lib/authz.ts](../src/lib/authz.ts) é um switch exaustivo sobre `Role`.
> Adicionar valores **quebra o build** até tratar os dois novos — comportamento desejado.

### 1.2 Departamento

```prisma
model Department {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  services Service[]
  members  DepartmentMember[]
  tasks    Task[]
}

model DepartmentMember {
  id           String  @id @default(cuid())
  departmentId String
  userId       String
  manager      Boolean @default(false)

  department Department @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([departmentId, userId])
  @@index([userId])
}
```

### 1.3 Catálogo de serviços

```prisma
enum ServiceNature { RECORRENTE SOB_DEMANDA }

/// Define a granularidade da tarefa gerada (D1).
/// EMPRESA        → 1 tarefa por cliente/período (folha, DRE, fechamento)
/// CONTA_BANCARIA → 1 tarefa por conta/período  (conciliação, pagamentos)
/// COLABORADOR    → 1 tarefa por colaborador     (reservado p/ RH, fase seguinte)
enum ServiceScope { EMPRESA CONTA_BANCARIA COLABORADOR }

model Service {
  id               String        @id @default(cuid())
  name             String
  departmentId     String
  nature           ServiceNature @default(RECORRENTE)
  scope            ServiceScope  @default(EMPRESA)
  requiresDocument Boolean       @default(false)
  estimatedMinutes Int?
  description      String?
  active           Boolean       @default(true)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  department        Department              @relation(fields: [departmentId], references: [id])
  checklistTemplate ChecklistTemplateItem[]
  contracts         ServiceContract[]
  tasks             Task[]

  @@index([departmentId])
}

model ChecklistTemplateItem {
  id        String  @id @default(cuid())
  serviceId String
  order     Int
  text      String
  required  Boolean @default(false)

  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([serviceId, order])
}
```

### 1.4 Contratação por cliente

```prisma
enum RecurrenceType { DIARIA SEMANAL QUINZENAL MENSAL TRIMESTRAL ANUAL }
enum NonBusinessDayAdjustment { ANTECIPAR POSTERGAR MANTER }

model ServiceContract {
  id            String  @id @default(cuid())
  companyId     String
  serviceId     String
  /// Obrigatório quando service.scope = CONTA_BANCARIA. Validado em Zod,
  /// não no banco — o Prisma não expressa condicional entre tabelas.
  bankAccountId String?

  recurrenceType   RecurrenceType
  /// MENSAL/TRIMESTRAL/ANUAL — dia do mês (1-31, com clamp no último dia)
  dayOfMonth       Int?
  /// SEMANAL/QUINZENAL — 0=domingo … 6=sábado
  weekday          Int?
  /// TRIMESTRAL/ANUAL — meses aplicáveis (1-12)
  months           Int[]
  /// Hora limite legal, "HH:mm". Corte bancário mora aqui.
  deadlineTime     String  @default("18:00")
  adjustment       NonBusinessDayAdjustment @default(POSTERGAR)
  /// Prazo meta = prazo legal − N dias úteis
  targetOffsetDays Int     @default(1)

  assigneeId String?
  startsOn   DateTime
  endsOn     DateTime?
  active     Boolean   @default(true)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  company     Company      @relation(fields: [companyId], references: [id], onDelete: Cascade)
  service     Service      @relation(fields: [serviceId], references: [id])
  bankAccount BankAccount? @relation(fields: [bankAccountId], references: [id])
  assignee    User?        @relation("ContractAssignee", fields: [assigneeId], references: [id])
  tasks       Task[]

  @@unique([companyId, serviceId, bankAccountId])
  @@index([active])
}
```

### 1.5 Tarefa

```prisma
enum TaskStatus { PENDENTE EM_ANDAMENTO AGUARDANDO_CLIENTE CONCLUIDA CANCELADA }
enum TaskOrigin { RECORRENTE ORDEM_SERVICO SOLICITACAO_CLIENTE EVENTO }

model Task {
  id                String  @id @default(cuid())
  companyId         String
  serviceId         String
  serviceContractId String?
  bankAccountId     String?
  departmentId      String

  periodStart   DateTime
  periodEnd     DateTime
  dueDateLegal  DateTime
  dueDateTarget DateTime

  assigneeId String?
  status     TaskStatus @default(PENDENTE)
  origin     TaskOrigin @default(RECORRENTE)

  completedAt   DateTime?
  completedById String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  company       Company             @relation(fields: [companyId], references: [id], onDelete: Cascade)
  service       Service             @relation(fields: [serviceId], references: [id])
  contract      ServiceContract?    @relation(fields: [serviceContractId], references: [id])
  bankAccount   BankAccount?        @relation(fields: [bankAccountId], references: [id])
  department    Department          @relation(fields: [departmentId], references: [id])
  assignee      User?               @relation("TaskAssignee", fields: [assigneeId], references: [id])
  completedBy   User?               @relation("TaskCompleter", fields: [completedById], references: [id])
  checklist     TaskChecklistItem[]
  history       TaskHistory[]

  /// Idempotência do gerador. Sem isso o sistema perde a confiança do time.
  @@unique([serviceContractId, periodStart])
  @@index([status, dueDateLegal])
  @@index([assigneeId, status])
  @@index([companyId, status])
  @@index([departmentId, status])
}

model TaskChecklistItem {
  id         String    @id @default(cuid())
  taskId     String
  order      Int
  text       String
  required   Boolean   @default(false)
  checkedAt  DateTime?
  checkedById String?

  task      Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  checkedBy User? @relation(fields: [checkedById], references: [id])

  @@unique([taskId, order])
}

model TaskHistory {
  id        String      @id @default(cuid())
  taskId    String
  fromStatus TaskStatus?
  toStatus   TaskStatus
  authorId   String
  note       String?
  createdAt  DateTime    @default(now())

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])

  @@index([taskId])
}

model GenerationRun {
  id             String   @id @default(cuid())
  startedAt      DateTime @default(now())
  finishedAt     DateTime?
  horizonEnd     DateTime
  tasksCreated   Int      @default(0)
  tasksSkipped   Int      @default(0)
  errors         String?
  triggeredById  String?
}
```

### 1.6 Estado derivado — nunca persistido

```ts
// src/lib/atividades/urgencia.ts
export type Urgency = "VENCIDA" | "HOJE" | "EM_RISCO" | "NO_PRAZO";

// VENCIDA   now > dueDateLegal   && status ∉ {CONCLUIDA, CANCELADA}
// HOJE      dueDateLegal é hoje  && status ∉ {CONCLUIDA, CANCELADA}
// EM_RISCO  now > dueDateTarget  && status ∉ {CONCLUIDA, CANCELADA}
// NO_PRAZO  caso contrário
```

`AGUARDANDO_CLIENTE` **pausa** a contagem de meta — o indicador não pode punir o time por atraso
do cliente.

---

## 2. Autorização

`/admin/*` permanece ADMIN-only (o layout atual já redireciona). Atividades ganham rota própria:

| Rota | Papéis | Layout |
|------|--------|--------|
| `/atividades` | ADMIN, GESTOR, OPERADOR | novo `src/app/atividades/layout.tsx` |
| `/atividades/[id]` | idem | idem |
| `/admin/servicos` | ADMIN | existente |

```ts
// homePathForRole — casos novos
case "GESTOR":
case "OPERADOR":
  return "/atividades";
```

**Escopo de leitura por papel:**

| Papel | Enxerga |
|-------|---------|
| OPERADOR | tarefas onde `assigneeId = self`, + as sem responsável do seu departamento |
| GESTOR | todas as tarefas dos departamentos onde é `DepartmentMember.manager` |
| ADMIN | todas |

Filtro aplicado na **camada de dados** (`src/lib/actions/atividades.ts`), nunca só na UI.

---

## 3. Motor de geração

`src/lib/atividades/gerar.ts` — função pura sobre o banco, sem cron ainda.

```
gerarAtividades({ horizonDays = 30, triggeredById? }) → GenerationRun
```

**Algoritmo**
1. Carregar `ServiceContract` ativos, com `startsOn <= hoje` e (`endsOn` nulo ou futuro),
   de clientes com `Company.status = ATIVO`.
2. Para cada contrato, expandir a regra até `hoje + horizonDays` → lista de `periodStart`.
3. Calcular `dueDateLegal` (data + `deadlineTime`, ajustada por dia não-útil) e
   `dueDateTarget` (`dueDateLegal − targetOffsetDays` dias úteis).
4. `createMany` com `skipDuplicates` — a unique `(serviceContractId, periodStart)` garante
   idempotência.
5. Copiar `ChecklistTemplateItem` → `TaskChecklistItem` (**snapshot**: alterar o template depois
   não mexe em tarefa já gerada).
6. Gravar `GenerationRun`.

**Invocação nesta fase:** `npm run atividades:gerar`. Cron/Vercel Cron entra depois de a fila
estar validada em uso real.

**Dia não-útil:** por ora, apenas sábado e domingo. A tabela `Holiday` entra no bloco 1 do plano
maior — até lá, feriado nacional é tratado manualmente.

---

## 4. Seed de referência

```
Department  Financeiro

Service     "Conciliação Bancária"
            departamento: Financeiro · nature: RECORRENTE
            scope: CONTA_BANCARIA · requiresDocument: true
            estimatedMinutes: 45

            Checklist:
              1. Importar extrato do período              [obrigatório]
              2. Conferir saldo inicial × saldo final     [obrigatório]
              3. Classificar lançamentos não identificados
              4. Baixar títulos correspondentes (CR/CP)
              5. Tratar divergências
              6. Gerar relatório de conciliação           [obrigatório]

ServiceContract  1 por conta bancária do cliente
                 recurrenceType: SEMANAL · weekday: 1 (segunda)
                 deadlineTime: "12:00" · adjustment: POSTERGAR
                 targetOffsetDays: 1

Users       1 OPERADOR e 1 GESTOR no departamento Financeiro
```

---

## 5. Telas

### 5.1 `/atividades` — a fila

A tela que decide se o sistema é usado. Abre já filtrada em **"minhas, não concluídas"**.

**Agrupamento por urgência**, não por data crua:

```
⚠ Vencidas (3)
   Conciliação Bancária · Alfa Ltda · Itaú 1234-5 · venceu seg 03/08 12:00
   …
● Hoje (5)
○ Esta semana (12)
○ Depois (8)
```

Cada linha: serviço · cliente · **escopo** (conta bancária) · prazo · responsável · progresso do
checklist (`3/6`). O escopo na linha não é decoração — com D1, o mesmo cliente aparece 4 vezes no
mesmo dia e sem a conta a lista fica ilegível.

**Filtros:** responsável · cliente · departamento · serviço · status · período.
Filtro em query string, para a URL ser compartilhável.

### 5.2 `/atividades/[id]` — a execução

- Cabeçalho: serviço, cliente, conta, competência, prazo legal e meta, responsável, status
- Checklist com marcação individual (registra quem e quando)
- Anexo de documento — reaproveita `Document`/`storage.ts` existentes
- Transições de status com registro em `TaskHistory`
- **Conclusão bloqueada** se `requiresDocument` e não houver anexo, ou se houver item obrigatório
  não marcado

### 5.3 `/admin/servicos` — depois

Cadastro de serviço e checklist. Por D2, entra após a fila estar de pé.

**Convenções a seguir:** Server Actions em `src/lib/actions/atividades.ts`, schemas Zod em
`src/lib/validations/atividade.ts`, classes de `src/components/ui/styles.ts`, `PortalNav` ganhando
o link "Atividades".

---

## 6. Ordem de construção

| # | Etapa | Entrega verificável | Estado |
|---|-------|--------------------|--------|
| 1 | Migration: `Role` + 8 modelos novos | `prisma migrate dev` limpo, build passando | ✅ `20260805180514_add_recurring_activities` |
| 2 | `authz.ts` + layout `/atividades` | GESTOR e OPERADOR logam e chegam na rota certa | ✅ inclui gate no `proxy.ts` |
| 3 | Seed de referência | Financeiro + Conciliação + contratos no banco | ✅ `prisma/seed-atividades.ts` |
| 4 | Gerador + `npm run atividades:gerar` | Tarefas geradas; rodar 2× não duplica | ✅ 6 criadas → 0 criadas / 6 puladas |
| 5 | **Fila `/atividades`** | Fila agrupada por urgência, com filtros | ✅ |
| 6 | Detalhe `/atividades/[id]` | Checklist, anexo, conclusão com trava | ✅ |
| 7 | Cadastro `/admin/servicos` + aba na empresa | Ciclo fechado sem seed | ✅ inclui departamentos, equipe e gatilho de geração |

**Ponto de verificação real:** a etapa 4 tem que ser rodada duas vezes seguidas e produzir
`tasksCreated: 0` na segunda. Se duplicar, para tudo e conserta antes de seguir.
Verificado: primeira execução criou 6, segunda criou 0 e pulou 6.

Recorte de leitura exercitado contra o banco real: ADMIN, GESTOR gerente do Financeiro e
OPERADOR responsável enxergam as 6; **operador sem departamento enxerga 0** — o escopo nega
por padrão em vez de vazar.

---

## 7. Pontos ainda abertos

1. **Feriados.** MVP trata só fim de semana. Conciliação com corte em feriado nacional vai gerar
   prazo errado até a tabela `Holiday` existir.
2. **Quinzenal.** `QUINZENAL` precisa de âncora (a partir de qual data conta a quinzena) —
   usar `startsOn` do contrato.
3. **Contrato órfão.** Excluir uma `BankAccount` com contrato ativo: bloquear ou desativar em
   cascata? Proponho **bloquear** com mensagem.
4. **Retroatividade.** Contratar um serviço hoje gera tarefas do passado? Proponho **não** —
   geração só a partir de `max(startsOn, hoje)`. *Implementado assim: o filtro é sobre o
   vencimento legal, não sobre o início do período, para não descartar a competência corrente
   de uma obrigação mensal contratada no meio do mês.*

---

## 8. Desvios da implementação em relação a este spec

| Spec dizia | Ficou | Por quê |
|------------|-------|---------|
| `src/lib/atividades/` | `src/lib/tasks/` | O repositório usa inglês em `src/lib` (`authz.ts`, `storage.ts`) e português nas rotas (`/admin/ferias`). A rota continua `/atividades`. |
| `TaskAttachment` ligando Task ↔ Document | `Document.taskId` (FK direta) | Um documento pertence a no máximo uma atividade; tabela de junção não pagaria o próprio custo. |
| Seed cria 1 GESTOR e 1 OPERADOR | Seed **não** cria usuários | O seed roda contra o banco de produção, com dados de clientes reais; semear contas com senha padrão ali é plantar credencial fraca. Os papéis já são atribuíveis em `/admin/usuarios`. O seed vincula os ADMINs existentes ao Financeiro. |
| — | `GET /api/documentos/[id]/arquivo` estendida | A rota só autorizava dono, ADMIN e RH da empresa. Um GESTOR não conseguiria abrir a evidência anexada pelo operador. Agora, se o documento pertence a uma atividade, vale o mesmo recorte de escopo das atividades. |
| Aritmética de datas em fuso local | Tudo em UTC, corte convertido com UTC-3 fixo | `periodStart` é metade da chave de idempotência; construído em fuso local, mudar de máquina ou de fuso quebraria a proteção contra duplicata. |

### Etapa 7 entregou mais do que o spec pedia

O spec listava "cadastro de serviço + aba na empresa". Faltavam duas peças sem as quais o ciclo
não fecha de fato:

- **Departamentos e equipe** (`/admin/departamentos`). Um serviço exige departamento, e o
  recorte de leitura depende de `DepartmentMember` — sem a tela, um GESTOR criado pela UI abre
  a fila vazia e não há como consertar sem mexer no banco.
- **Gatilho de geração pela UI** (botão em `/admin/servicos`). Sem ele, contratar um serviço
  ainda exigia o terminal, e "ciclo fechado sem seed" não seria verdade.

### Bug encontrado na verificação

`Number(undefined)` retorna `NaN`, e NaN atravessa `.optional()` do Zod como se fosse valor
informado. Um contrato **semanal sem dia da semana passava na validação** e caía no padrão
silencioso do gerador (segunda-feira). Afetava também `dayOfMonth` e `estimatedMinutes`.
Corrigido em `optionalInt` e `targetOffsetDays`, com regressão coberta por
`npm run atividades:checar`.

### Ainda não existe

- **Cron.** A geração roda por `npm run atividades:gerar` ou pelo botão em `/admin/servicos`.
  Agendamento entra depois da fila validada em uso real.
- **Feriados.** Dia não-útil = sábado e domingo. Obrigação que cai em feriado nacional gera
  prazo otimista até a tabela `Holiday` existir.
- **Edição de contrato.** Dá para criar, desativar e reativar; alterar a regra exige desativar
  e contratar de novo.
- **Serviços `SOB_DEMANDA`** aparecem no catálogo mas não são contratáveis — dependem do bloco
  de ordens de serviço (B5 do plano maior).

## Revisão de 08/10/2026 — as atividades passam a morar na empresa

O menu do admin deixou de ter "Serviços" e "Atividades". O fluxo agora parte de **Empresas**:

- **Empresas → empresa → aba "Gestão de Tarefas"** (`/admin/empresas/[id]/tarefas`) mostra a árvore
  `serviço → conta bancária (só nos serviços por conta) → mês → datas`, cada data com uma caixa de
  conclusão. A caixa conclui pela mesma regra de `completeTaskAction` (checklist obrigatório completo
  e, se o serviço exige, anexo); quando barra, o motivo aparece na linha. Reabrir é clicar na caixa de
  novo. Cada data abre as etapas do checklist ali mesmo.
- **Contratar serviço** (recorrência) fica na mesma aba e já gera as demandas dos próximos 30 dias ao
  salvar. **Nova demanda** abre uma demanda avulsa (pedido do cliente ou ordem de serviço), sem
  contrato: `serviceContractId` nulo, vencimento escolhido, checklist copiado do serviço.
- **Gerar próximas demandas** roda o gerador só para a empresa. Continua não havendo cron: sem o botão
  (ou `npm run atividades:gerar`), as demandas recorrentes acabam quando o horizonte de 30 dias passa.
- O **catálogo de serviços** e os **departamentos** seguem em `/admin/servicos` e
  `/admin/departamentos`, agora alcançados por links em Empresas. A **fila** `/atividades` continua
  existindo para GESTOR e OPERADOR, que não entram em `/admin`; o ADMIN chega nela por Empresas.
- `/admin/empresas/[id]/servicos` redireciona para `/tarefas`.

## Acesso da equipe da Matriz (08/10/2026)

O acesso às demais empresas vem do **cadastro na Matriz** (a empresa com `isHeadquarters`):

- `taskScopeFor` só devolve um recorte para GESTOR/OPERADOR **ativos e cadastrados na Matriz**
  (`isHeadquartersStaff`, que consulta o banco, não o token). Quem tem papel interno mas está em outra
  empresa recebe um aviso no layout de `/atividades` e nenhuma demanda. O ADMIN segue vendo tudo.
- Criar ou editar um usuário como Operador ou Gestor grava a empresa **Matriz** automaticamente, mesmo
  que outra tenha sido escolhida no formulário. Sem Matriz marcada, o cadastro é recusado com aviso.
- `/atividades/empresas` lista as empresas clientes e `/atividades/empresas/[id]` mostra a mesma árvore
  da aba do admin, **sem** contratar, gerar nem abrir demanda avulsa (isso segue só do ADMIN) e sem RH,
  folha, documentos ou dados bancários.
- O recorte por departamento continua valendo: o que cada gestor/operador vê dentro de cada empresa
  depende dos departamentos de que participa. Quem é cadastrado e ainda não está em departamento algum
  vê só as demandas atribuídas a si.

## Anexo deixou de ser exigência (08/10/2026)

Concluir uma atividade depende só do checklist obrigatório. `Service.requiresDocument` não é mais lido
nem gravado (a coluna ficou no banco para não exigir migração): saíram a caixa "Exige documento de
entrega" do cadastro do serviço, a etiqueta no catálogo, a trava em `completeTaskAction` e os avisos
da tela da atividade. Anexar um documento continua possível, como opcional.

## Geração automática, aviso de conclusão e lista enxuta (08/10/2026)

- **Geração automática:** `vercel.json` agenda `/api/cron/gerar-atividades` todo dia às 09:00 UTC
  (06:00 em Brasília). A rota exige `Authorization: Bearer $CRON_SECRET` (variável de produção; sem ela
  a rota recusa todo mundo) e chama `generateTasks()` com o horizonte padrão de 30 dias. Idempotente.
  O botão "Gerar próximas demandas" e `npm run atividades:gerar` continuam valendo.
- **Aviso de conclusão:** `completeTaskAction` envia um e-mail a cada atividade concluída, depois da
  resposta (`after`), para `dabliwbpo@gmail.com` (troca por `TASK_NOTIFY_EMAIL`). Falha de e-mail só
  vai para o log; a conclusão não é desfeita nem atrasada.
- **Lista enxuta:** a árvore da empresa mostra só o que está em aberto. As concluídas e canceladas saem
  da lista e voltam pelo link "Mostrar N concluídas ocultas" (`?concluidas=1`), onde também dá para
  reabrir. A fila `/atividades` já abria em "não concluídas".
