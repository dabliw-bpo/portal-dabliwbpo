"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { requireRole, INTERNAL_ROLES } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { ASSIGNABLE_USERS } from "@/lib/tasks/assignees";
import { generateTasks } from "@/lib/tasks/generate";
import {
  departmentSchema,
  membershipSchema,
  serviceContractSchema,
  serviceSchema,
} from "@/lib/validations/service";

export type ServiceFormState = {
  error?: string;
  success?: string;
};

/** A árvore de demandas de uma empresa mora em /admin/empresas/[id]/tarefas. */
function revalidateCompanyTasks(companyId: string) {
  revalidatePath(`/admin/empresas/${companyId}/tarefas`);
}

/** Datas de vigência são dia cheio: meia-noite UTC, igual ao gerador. */
function toUtcDay(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// ---------------------------------------------------------------------------
// Departamentos
// ---------------------------------------------------------------------------

export async function createDepartmentAction(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.department.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { error: "Já existe um departamento com esse nome." };
  }

  await prisma.department.create({
    data: { name: parsed.data.name, color: parsed.data.color ?? null },
  });

  revalidatePath("/admin/departamentos");
  return { success: "Departamento criado." };
}

export async function updateDepartmentAction(
  departmentId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    color: formData.get("color"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const clash = await prisma.department.findFirst({
    where: { name: parsed.data.name, id: { not: departmentId } },
  });
  if (clash) {
    return { error: "Já existe um departamento com esse nome." };
  }

  await prisma.department.update({
    where: { id: departmentId },
    data: {
      name: parsed.data.name,
      color: parsed.data.color ?? null,
      active: formData.get("active") === "on",
    },
  });

  revalidatePath("/admin/departamentos");
  revalidatePath(`/admin/departamentos/${departmentId}`);
  return { success: "Departamento salvo." };
}

/**
 * Sincroniza a equipe do departamento em uma tacada. Sem membro cadastrado um
 * GESTOR abre a fila vazia e um OPERADOR não recebe as atividades sem
 * responsável — é aqui que o recorte de leitura ganha conteúdo.
 */
export async function setDepartmentMembersAction(
  departmentId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const internalUsers = await prisma.user.findMany({
    where: { role: { in: [...INTERNAL_ROLES] }, active: true },
    select: { id: true },
  });

  const desired = new Map<string, boolean>();
  for (const user of internalUsers) {
    const parsed = membershipSchema.safeParse(formData.get(`membership-${user.id}`) ?? "none");
    if (!parsed.success) {
      return { error: "Vínculo inválido." };
    }
    if (parsed.data !== "none") {
      desired.set(user.id, parsed.data === "manager");
    }
  }

  await prisma.$transaction([
    prisma.departmentMember.deleteMany({
      where: { departmentId, userId: { notIn: [...desired.keys()] } },
    }),
    ...[...desired.entries()].map(([userId, manager]) =>
      prisma.departmentMember.upsert({
        where: { departmentId_userId: { departmentId, userId } },
        update: { manager },
        create: { departmentId, userId, manager },
      })
    ),
  ]);

  revalidatePath(`/admin/departamentos/${departmentId}`);
  revalidatePath("/atividades");
  return { success: "Equipe atualizada." };
}

// ---------------------------------------------------------------------------
// Serviços
// ---------------------------------------------------------------------------

function parseService(formData: FormData) {
  return serviceSchema.safeParse({
    name: formData.get("name"),
    departmentId: formData.get("departmentId"),
    nature: formData.get("nature"),
    scope: formData.get("scope"),
    estimatedMinutes: formData.get("estimatedMinutes"),
    description: formData.get("description"),
    checklist: formData.get("checklist"),
  });
}

export async function createServiceAction(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseService(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const service = await prisma.service.create({
    data: {
      name: parsed.data.name,
      departmentId: parsed.data.departmentId,
      nature: parsed.data.nature,
      scope: parsed.data.scope,
      estimatedMinutes: parsed.data.estimatedMinutes ?? null,
      description: parsed.data.description ?? null,
      checklistTemplate: {
        create: parsed.data.checklist.map((item, index) => ({
          order: index + 1,
          text: item.text,
          required: item.required,
        })),
      },
    },
  });

  revalidatePath("/admin/servicos");
  redirect(`/admin/servicos/${service.id}`);
}

export async function updateServiceAction(
  serviceId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = parseService(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  // O checklist é reescrito inteiro. Isso não afeta atividade já gerada: o
  // `TaskChecklistItem` é cópia, não referência ao template.
  await prisma.$transaction([
    prisma.checklistTemplateItem.deleteMany({ where: { serviceId } }),
    prisma.service.update({
      where: { id: serviceId },
      data: {
        name: parsed.data.name,
        departmentId: parsed.data.departmentId,
        nature: parsed.data.nature,
        scope: parsed.data.scope,
        estimatedMinutes: parsed.data.estimatedMinutes ?? null,
        description: parsed.data.description ?? null,
        active: formData.get("active") === "on",
        checklistTemplate: {
          create: parsed.data.checklist.map((item, index) => ({
            order: index + 1,
            text: item.text,
            required: item.required,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/servicos");
  revalidatePath(`/admin/servicos/${serviceId}`);
  return { success: "Serviço salvo." };
}

// ---------------------------------------------------------------------------
// Contratação por cliente
// ---------------------------------------------------------------------------

export async function createServiceContractAction(
  companyId: string,
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const parsed = serviceContractSchema.safeParse({
    serviceId: formData.get("serviceId"),
    bankAccountId: formData.get("bankAccountId"),
    recurrenceType: formData.get("recurrenceType"),
    dayOfMonth: formData.get("dayOfMonth"),
    weekday: formData.get("weekday"),
    months: formData.getAll("months"),
    deadlineTime: formData.get("deadlineTime"),
    adjustment: formData.get("adjustment"),
    targetOffsetDays: formData.get("targetOffsetDays"),
    assigneeId: formData.get("assigneeId"),
    startsOn: formData.get("startsOn"),
    endsOn: formData.get("endsOn"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId } });
  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  // A granularidade é propriedade do serviço, então a exigência da conta é
  // verificada aqui e não no schema — o formulário não é fonte confiável.
  if (service.scope === "CONTA_BANCARIA" && !parsed.data.bankAccountId) {
    return { error: "Este serviço é por conta bancária. Selecione a conta." };
  }
  if (service.scope !== "CONTA_BANCARIA" && parsed.data.bankAccountId) {
    return { error: "Este serviço não é por conta bancária." };
  }

  if (parsed.data.bankAccountId) {
    const account = await prisma.bankAccount.findFirst({
      where: { id: parsed.data.bankAccountId, companyId },
    });
    if (!account) {
      return { error: "Conta bancária não pertence a esta empresa." };
    }
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

  const duplicate = await prisma.serviceContract.findFirst({
    where: {
      companyId,
      serviceId: parsed.data.serviceId,
      bankAccountId: parsed.data.bankAccountId ?? null,
    },
  });
  if (duplicate) {
    return { error: "Este serviço já está contratado para este escopo." };
  }

  const contract = await prisma.serviceContract.create({
    data: {
      companyId,
      serviceId: parsed.data.serviceId,
      bankAccountId: parsed.data.bankAccountId ?? null,
      recurrenceType: parsed.data.recurrenceType,
      dayOfMonth: parsed.data.dayOfMonth ?? null,
      weekday: parsed.data.weekday ?? null,
      months: parsed.data.months,
      deadlineTime: parsed.data.deadlineTime,
      adjustment: parsed.data.adjustment,
      targetOffsetDays: parsed.data.targetOffsetDays,
      assigneeId: parsed.data.assigneeId ?? null,
      startsOn: toUtcDay(parsed.data.startsOn),
      endsOn: parsed.data.endsOn ? toUtcDay(parsed.data.endsOn) : null,
    },
  });

  // Contratar já abre as demandas dos próximos dias: ninguém precisa lembrar de
  // rodar o gerador para ver o serviço aparecer na árvore da empresa.
  const result = await generateTasks({
    contractId: contract.id,
    triggeredById: session?.user?.id,
  });

  revalidateCompanyTasks(companyId);
  return {
    success:
      result.tasksCreated > 0
        ? `Serviço contratado. ${result.tasksCreated} demanda(s) aberta(s) nos próximos dias.`
        : "Serviço contratado. Nenhuma demanda cai nos próximos dias — elas aparecem quando chegar a data.",
  };
}

export async function toggleServiceContractAction(contractId: string): Promise<void> {
  const session = await auth();
  requireRole(session, ["ADMIN"]);

  const contract = await prisma.serviceContract.findUnique({ where: { id: contractId } });
  if (!contract) {
    throw new Error("Contrato não encontrado.");
  }

  await prisma.serviceContract.update({
    where: { id: contractId },
    data: { active: !contract.active },
  });

  revalidateCompanyTasks(contract.companyId);
}

/**
 * Gera as próximas demandas só da empresa aberta. Enquanto não há agendamento
 * automático, é o botão da aba Gestão de Tarefas que mantém a árvore em dia.
 */
export async function generateCompanyTasksAction(
  companyId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- assinatura exigida pelo useActionState
  _prevState: ServiceFormState
): Promise<ServiceFormState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const result = await generateTasks({ companyId, triggeredById: authSession.user.id });

  revalidateCompanyTasks(companyId);
  revalidatePath("/atividades");

  const warning = result.errors.length > 0 ? ` ${result.errors.length} aviso(s).` : "";
  return {
    success:
      result.tasksCreated > 0
        ? `${result.tasksCreated} demanda(s) criada(s).${warning}`
        : `Nada novo para criar — as demandas dos próximos dias já existem.${warning}`,
  };
}

/**
 * Dispara o gerador pela UI. Enquanto não existe agendamento, é isto que fecha
 * o ciclo: contratar um serviço e ver a atividade aparecer na fila sem
 * precisar do terminal.
 */
export async function runGenerationAction(
  _prevState: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  const session = await auth();
  const authSession = requireRole(session, ["ADMIN"]);

  const raw = formData.get("horizonDays");
  const horizonDays = raw ? Number(raw) : undefined;
  if (raw && (!Number.isFinite(horizonDays) || horizonDays! < 1 || horizonDays! > 365)) {
    return { error: "Horizonte deve estar entre 1 e 365 dias." };
  }

  const result = await generateTasks({ horizonDays, triggeredById: authSession.user.id });

  revalidatePath("/atividades");
  revalidatePath("/admin/servicos");

  const warning = result.errors.length > 0 ? ` ${result.errors.length} aviso(s).` : "";
  return {
    success: `${result.tasksCreated} atividade(s) criada(s), ${result.tasksSkipped} já existiam.${warning}`,
  };
}
