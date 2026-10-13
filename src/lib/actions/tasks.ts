"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import { AuthzError, requireRole } from "@/lib/authz";
import { sendTaskCompletedEmail } from "@/lib/email";
import { createId } from "@/lib/id";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/storage";
import { ASSIGNABLE_USERS } from "@/lib/tasks/assignees";
import { taskNotificationEmail } from "@/lib/tasks/notify";
import { applyDeadlineTime } from "@/lib/tasks/recurrence";
import { assertCanActOnTask } from "@/lib/tasks/scope";
import { OPEN_STATUSES, isOpen } from "@/lib/tasks/urgency";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validations/document";
import {
  attachDocumentSchema,
  canTransition,
  changeStatusSchema,
  createDemandSchema,
  deleteSeriesSchema,
  deleteTaskSchema,
  reassignSchema,
  toggleChecklistSchema,
} from "@/lib/validations/task";

export type TaskActionState = {
  error?: string;
  success?: string;
};

function revalidateTaskLists() {
  revalidatePath("/atividades");
  // A árvore de demandas de cada empresa mostra as mesmas tarefas da fila.
  revalidatePath("/admin/empresas/[id]/tarefas", "page");
  revalidatePath("/atividades/empresas/[id]", "page");
}

function revalidateTask(taskId: string) {
  revalidateTaskLists();
  revalidatePath(`/atividades/${taskId}`);
}

/** Uma atividade concluída ou cancelada não aceita mais edição de execução. */
function assertEditable(status: string) {
  if (status === "CONCLUIDA" || status === "CANCELADA") {
    throw new AuthzError("Atividade encerrada — reabra antes de editar.");
  }
}

export async function toggleChecklistItemAction(formData: FormData): Promise<void> {
  const session = await auth();
  const parsed = toggleChecklistSchema.safeParse({
    taskId: formData.get("taskId"),
    itemId: formData.get("itemId"),
  });
  if (!parsed.success) {
    throw new Error("Dados inválidos.");
  }

  const authSession = await assertCanActOnTask(session, parsed.data.taskId);

  const item = await prisma.taskChecklistItem.findFirst({
    where: { id: parsed.data.itemId, taskId: parsed.data.taskId },
    include: { task: { select: { status: true } } },
  });
  if (!item) {
    throw new Error("Item não encontrado.");
  }
  assertEditable(item.task.status);

  await prisma.taskChecklistItem.update({
    where: { id: item.id },
    data: item.checkedAt
      ? { checkedAt: null, checkedById: null }
      : { checkedAt: new Date(), checkedById: authSession.user.id },
  });

  revalidateTask(parsed.data.taskId);
}

export async function changeTaskStatusAction(formData: FormData): Promise<void> {
  const session = await auth();
  const parsed = changeStatusSchema.safeParse({
    taskId: formData.get("taskId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error("Dados inválidos.");
  }

  const authSession = await assertCanActOnTask(session, parsed.data.taskId);

  const task = await prisma.task.findUnique({
    where: { id: parsed.data.taskId },
    select: { id: true, status: true, assigneeId: true },
  });
  if (!task) {
    throw new Error("Atividade não encontrada.");
  }
  if (!canTransition(task.status, parsed.data.status)) {
    throw new Error("Transição de status não permitida.");
  }

  await prisma.$transaction([
    prisma.task.update({
      where: { id: task.id },
      data: {
        status: parsed.data.status,
        // Pegar uma atividade sem dono é assumi-la: sem isso ela continuaria
        // aparecendo na fila de todo mundo do departamento.
        assigneeId:
          task.assigneeId ?? (parsed.data.status === "EM_ANDAMENTO" ? authSession.user.id : null),
        // Nenhuma transição desta ação leva a CONCLUIDA (concluir tem regra
        // própria), então aqui a conclusão é sempre limpa — é o que faz
        // reabrir uma atividade parar de contá-la como entregue.
        completedAt: null,
        completedById: null,
      },
    }),
    prisma.taskHistory.create({
      data: {
        taskId: task.id,
        fromStatus: task.status,
        toStatus: parsed.data.status,
        authorId: authSession.user.id,
        note: parsed.data.note,
      },
    }),
  ]);

  revalidateTask(task.id);
}

export async function completeTaskAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) {
    return { error: "Atividade não informada." };
  }

  try {
    const authSession = await assertCanActOnTask(session, taskId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklist: { select: { required: true, checkedAt: true } },
        company: { select: { name: true } },
        service: { select: { name: true } },
        bankAccount: { select: { bankName: true, agency: true, accountNumber: true } },
        _count: { select: { documents: true } },
      },
    });
    if (!task) {
      return { error: "Atividade não encontrada." };
    }
    if (task.status === "CONCLUIDA") {
      return { error: "Esta atividade já está concluída." };
    }
    if (task.status === "CANCELADA") {
      return { error: "Atividade cancelada — reative antes de concluir." };
    }

    const pendingRequired = task.checklist.filter((item) => item.required && !item.checkedAt);
    if (pendingRequired.length > 0) {
      return {
        error: `Faltam ${pendingRequired.length} item(ns) obrigatório(s) do checklist.`,
      };
    }

    await prisma.$transaction([
      prisma.task.update({
        where: { id: task.id },
        data: {
          status: "CONCLUIDA",
          completedAt: new Date(),
          completedById: authSession.user.id,
          assigneeId: task.assigneeId ?? authSession.user.id,
        },
      }),
      prisma.taskHistory.create({
        data: {
          taskId: task.id,
          fromStatus: task.status,
          toStatus: "CONCLUIDA",
          authorId: authSession.user.id,
        },
      }),
    ]);

    revalidateTask(task.id);

    // O aviso sai depois da resposta: a conclusão já está gravada e não espera
    // (nem falha) por causa do e-mail.
    const completedAt = new Date();
    const appUrl = process.env.APP_URL;
    after(async () => {
      await sendTaskCompletedEmail({
        to: taskNotificationEmail(),
        companyName: task.company.name,
        serviceName: task.service.name,
        accountLabel: task.bankAccount
          ? `${task.bankAccount.bankName} · ag ${task.bankAccount.agency} · cc ${task.bankAccount.accountNumber}`
          : null,
        dueDate: task.dueDateLegal,
        completedBy: authSession.user.name ?? "Equipe",
        completedAt,
        checklistDone: task.checklist.filter((item) => item.checkedAt).length,
        checklistTotal: task.checklist.length,
        documentCount: task._count.documents,
        taskUrl: appUrl ? `${appUrl}/atividades/${task.id}` : undefined,
      });
    });

    return { success: "Atividade concluída." };
  } catch (error) {
    if (error instanceof AuthzError) {
      return { error: error.message };
    }
    throw error;
  }
}

export async function attachTaskDocumentAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  const parsed = attachDocumentSchema.safeParse({
    taskId: formData.get("taskId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    const authSession = await assertCanActOnTask(session, parsed.data.taskId);

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      select: { id: true, status: true },
    });
    if (!task) {
      return { error: "Atividade não encontrada." };
    }
    if (task.status === "CONCLUIDA" || task.status === "CANCELADA") {
      return { error: "Atividade encerrada — reabra antes de anexar." };
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return { error: "Selecione um arquivo." };
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      return { error: "Tipo de arquivo não permitido. Use PDF, DOC(X), PNG ou JPG." };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { error: "Arquivo maior que 15MB." };
    }

    const id = createId();
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = await saveFile(buffer, file.name, id);

    await prisma.document.create({
      data: {
        id,
        title: parsed.data.title,
        type: "OTHER",
        // Evidência não é documento a assinar: sem isto o padrão
        // (PENDING_SIGNATURE) a colocaria na fila de assinatura de quem a
        // anexou — e o colaborador da Matriz anexa pela tela de atividades.
        status: "ARCHIVED",
        // A evidência de entrega pertence a quem a produziu. Quando o bloco de
        // portal do cliente entrar, é aqui que passa a valer a visibilidade
        // para o cliente.
        ownerUserId: authSession.user.id,
        uploadedByUserId: authSession.user.id,
        taskId: task.id,
        filePath,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      },
    });

    revalidateTask(task.id);
    return { success: "Documento anexado." };
  } catch (error) {
    if (error instanceof AuthzError) {
      return { error: error.message };
    }
    throw error;
  }
}

/**
 * Abre uma demanda avulsa para a empresa — o pedido que não vem de contrato
 * recorrente. Nasce como qualquer atividade (checklist copiado do serviço,
 * histórico aberto), só que sem `serviceContractId`.
 */
export async function createDemandAction(
  companyId: string,
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const parsed = createDemandSchema.safeParse({
    serviceId: formData.get("serviceId"),
    bankAccountId: formData.get("bankAccountId"),
    dueDate: formData.get("dueDate"),
    dueTime: formData.get("dueTime"),
    origin: formData.get("origin"),
    assigneeId: formData.get("assigneeId"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const [company, service] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId }, select: { id: true } }),
    prisma.service.findUnique({
      where: { id: parsed.data.serviceId },
      include: { checklistTemplate: { orderBy: { order: "asc" } } },
    }),
  ]);
  if (!company) {
    return { error: "Empresa não encontrada." };
  }
  if (!service || !service.active) {
    return { error: "Serviço não encontrado ou inativo." };
  }
  if (service.scope === "COLABORADOR") {
    return { error: "Serviços por colaborador ainda não podem ser abertos por aqui." };
  }

  if (service.scope === "CONTA_BANCARIA") {
    if (!parsed.data.bankAccountId) {
      return { error: "Este serviço é por conta bancária. Selecione a conta." };
    }
    const account = await prisma.bankAccount.findFirst({
      where: { id: parsed.data.bankAccountId, companyId },
      select: { id: true },
    });
    if (!account) {
      return { error: "Conta bancária não pertence a esta empresa." };
    }
  } else if (parsed.data.bankAccountId) {
    return { error: "Este serviço não é por conta bancária." };
  }

  if (parsed.data.assigneeId) {
    const assignee = await prisma.user.findFirst({
      where: { AND: [{ id: parsed.data.assigneeId }, ASSIGNABLE_USERS] },
      select: { id: true },
    });
    if (!assignee) {
      return { error: "Responsável inválido." };
    }
  }

  const [year, month, day] = parsed.data.dueDate.split("-").map(Number);
  const dueDay = new Date(Date.UTC(year, month - 1, day));
  const due = applyDeadlineTime(dueDay, parsed.data.dueTime);

  await prisma.task.create({
    data: {
      companyId,
      serviceId: service.id,
      bankAccountId: parsed.data.bankAccountId ?? null,
      departmentId: service.departmentId,
      periodStart: dueDay,
      periodEnd: dueDay,
      dueDateLegal: due,
      // Demanda avulsa não tem folga interna: a meta é o próprio prazo.
      dueDateTarget: due,
      assigneeId: parsed.data.assigneeId ?? null,
      origin: parsed.data.origin,
      checklist: {
        create: service.checklistTemplate.map((item) => ({
          order: item.order,
          text: item.text,
          required: item.required,
        })),
      },
      history: {
        create: {
          fromStatus: null,
          toStatus: "PENDENTE",
          authorId: authSession.user.id,
          note: parsed.data.note ?? null,
        },
      },
    },
  });

  revalidateTaskLists();
  return { success: "Demanda aberta." };
}

// ---------------------------------------------------------------------------
// Exclusão e troca de responsável (admin)
//
// "Excluir" aqui é cancelar com motivo, não apagar a linha: o gerador diário
// recria qualquer período que não exista mais, então uma demanda apagada
// voltaria no dia seguinte. Cancelada ela continua ocupando o período (a
// unique contrato + período segue valendo), some da lista e guarda o motivo no
// histórico — e dá para reativá-la pela lista de ocultas.
// ---------------------------------------------------------------------------

export async function deleteTaskAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  try {
    const authSession = requireRole(session, ["ADMIN"]);

    const parsed = deleteTaskSchema.safeParse({
      taskId: formData.get("taskId"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const task = await prisma.task.findUnique({
      where: { id: parsed.data.taskId },
      select: { id: true, status: true },
    });
    if (!task) {
      return { error: "Atividade não encontrada." };
    }
    if (!isOpen(task.status)) {
      return {
        error:
          task.status === "CONCLUIDA"
            ? "Atividade concluída — reabra antes de excluir."
            : "Esta atividade já foi excluída.",
      };
    }

    await prisma.$transaction([
      prisma.task.update({
        where: { id: task.id },
        data: { status: "CANCELADA", completedAt: null, completedById: null },
      }),
      prisma.taskHistory.create({
        data: {
          taskId: task.id,
          fromStatus: task.status,
          toStatus: "CANCELADA",
          authorId: authSession.user.id,
          note: `Excluída: ${parsed.data.reason}`,
        },
      }),
    ]);

    revalidateTask(task.id);
    return { success: "Atividade excluída." };
  } catch (error) {
    if (error instanceof AuthzError) {
      return { error: error.message };
    }
    throw error;
  }
}

/**
 * Exclui a série inteira de uma conta: cancela todas as demandas em aberto e
 * desativa o contrato, para o gerador não abrir mais nenhuma. As concluídas
 * ficam como estão.
 */
export async function deleteSeriesAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  try {
    const authSession = requireRole(session, ["ADMIN"]);

    const parsed = deleteSeriesSchema.safeParse({
      companyId: formData.get("companyId"),
      serviceId: formData.get("serviceId"),
      bankAccountId: formData.get("bankAccountId"),
      reason: formData.get("reason"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }
    const { companyId, serviceId, reason } = parsed.data;
    const bankAccountId = parsed.data.bankAccountId ?? null;

    const result = await prisma.$transaction(
      async (tx) => {
        const open = await tx.task.findMany({
          where: { companyId, serviceId, bankAccountId, status: { in: [...OPEN_STATUSES] } },
          select: { id: true, status: true },
        });
        if (open.length > 0) {
          await tx.task.updateMany({
            where: { id: { in: open.map((t) => t.id) } },
            data: { status: "CANCELADA", completedAt: null, completedById: null },
          });
          await tx.taskHistory.createMany({
            data: open.map((t) => ({
              taskId: t.id,
              fromStatus: t.status,
              toStatus: "CANCELADA" as const,
              authorId: authSession.user.id,
              note: `Excluída com a série: ${reason}`,
            })),
          });
        }
        const contracts = await tx.serviceContract.updateMany({
          where: { companyId, serviceId, bankAccountId },
          data: { active: false },
        });
        return { tasks: open.length, contracts: contracts.count };
      },
      { timeout: 30_000 }
    );

    revalidateTaskLists();
    return {
      success: `${result.tasks} demanda(s) excluída(s)${
        result.contracts > 0 ? " e contrato desativado" : ""
      }.`,
    };
  } catch (error) {
    if (error instanceof AuthzError) {
      return { error: error.message };
    }
    throw error;
  }
}

/**
 * Troca o responsável de todas as demandas em aberto de uma conta (ou de todas
 * as contas do serviço) de uma vez e atualiza o responsável padrão dos
 * contratos, para as próximas demandas já nascerem com ele.
 */
export async function reassignTasksAction(
  _prevState: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const session = await auth();
  try {
    const authSession = requireRole(session, ["ADMIN"]);

    const parsed = reassignSchema.safeParse({
      companyId: formData.get("companyId"),
      serviceId: formData.get("serviceId"),
      bankAccountId: formData.get("bankAccountId"),
      assigneeId: formData.get("assigneeId"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }
    const { companyId, serviceId } = parsed.data;
    const bankAccountId = parsed.data.bankAccountId;
    const assigneeId = parsed.data.assigneeId ?? null;

    let assigneeName = "Sem responsável";
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { AND: [{ id: assigneeId }, ASSIGNABLE_USERS] },
        select: { name: true },
      });
      if (!assignee) {
        return { error: "Responsável inválido." };
      }
      assigneeName = assignee.name;
    }

    const scopeWhere = { companyId, serviceId, ...(bankAccountId ? { bankAccountId } : {}) };

    const changed = await prisma.$transaction(
      async (tx) => {
        const open = await tx.task.findMany({
          where: { ...scopeWhere, status: { in: [...OPEN_STATUSES] } },
          select: { id: true, status: true, assigneeId: true, assignee: { select: { name: true } } },
        });
        const toChange = open.filter((t) => t.assigneeId !== assigneeId);
        if (toChange.length > 0) {
          await tx.task.updateMany({
            where: { id: { in: toChange.map((t) => t.id) } },
            data: { assigneeId },
          });
          await tx.taskHistory.createMany({
            data: toChange.map((t) => ({
              taskId: t.id,
              fromStatus: null,
              toStatus: t.status,
              authorId: authSession.user.id,
              note: `Responsável alterado: ${t.assignee?.name ?? "Sem responsável"} → ${assigneeName}`,
            })),
          });
        }
        await tx.serviceContract.updateMany({ where: scopeWhere, data: { assigneeId } });
        return toChange.length;
      },
      { timeout: 30_000 }
    );

    revalidateTaskLists();
    return {
      success:
        changed === 0
          ? `Nada a alterar: as demandas em aberto já estão com ${assigneeName}.`
          : `${changed} demanda(s) passaram para ${assigneeName}. As próximas já nascem com ele.`,
    };
  } catch (error) {
    if (error instanceof AuthzError) {
      return { error: error.message };
    }
    throw error;
  }
}
