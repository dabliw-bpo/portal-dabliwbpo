import { loadEnvConfig } from "@next/env";

// `.env.local` só é carregado sozinho pelo Next; fora do runtime é preciso
// pedir, como faz `prisma.config.ts`.
loadEnvConfig(process.cwd());

/**
 * Seed de referência das atividades recorrentes.
 *
 * Cria a estrutura mínima para a fila existir: o departamento Financeiro, o
 * serviço "Conciliação Bancária" com o checklist padrão, e um contrato semanal
 * para cada conta bancária já cadastrada.
 *
 * Deliberadamente NÃO cria usuários de demonstração. Este seed roda contra o
 * banco real, com dados de clientes; semear contas com senha padrão ali seria
 * plantar credencial fraca em produção. Os papéis GESTOR e OPERADOR já podem
 * ser atribuídos pela tela `/admin/usuarios`.
 *
 * É idempotente: rodar duas vezes não duplica nada.
 */

const DEPARTMENT_NAME = "Financeiro";
const SERVICE_NAME = "Conciliação Bancária";

const CHECKLIST: Array<{ text: string; required: boolean }> = [
  { text: "Importar extrato do período", required: true },
  { text: "Conferir saldo inicial × saldo final", required: true },
  { text: "Classificar lançamentos não identificados", required: false },
  { text: "Baixar títulos correspondentes (CR/CP)", required: false },
  { text: "Tratar divergências", required: false },
  { text: "Gerar relatório de conciliação", required: true },
];

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const department = await prisma.department.upsert({
      where: { name: DEPARTMENT_NAME },
      update: {},
      create: { name: DEPARTMENT_NAME, color: "#0f766e" },
    });
    console.log(`departamento: ${department.name}`);

    const existingService = await prisma.service.findFirst({
      where: { name: SERVICE_NAME, departmentId: department.id },
    });

    const service =
      existingService ??
      (await prisma.service.create({
        data: {
          name: SERVICE_NAME,
          departmentId: department.id,
          nature: "RECORRENTE",
          // Conciliação é por conta: cada conta vira uma atividade própria.
          scope: "CONTA_BANCARIA",
          // O relatório de conciliação é a evidência de entrega.
          requiresDocument: true,
          estimatedMinutes: 45,
          description:
            "Conferência do extrato bancário do período contra os lançamentos do sistema, com tratamento de divergências e emissão do relatório de conciliação.",
        },
      }));
    console.log(`servico: ${service.name} (${existingService ? "ja existia" : "criado"})`);

    const templateCount = await prisma.checklistTemplateItem.count({
      where: { serviceId: service.id },
    });
    if (templateCount === 0) {
      await prisma.checklistTemplateItem.createMany({
        data: CHECKLIST.map((item, index) => ({
          serviceId: service.id,
          order: index + 1,
          text: item.text,
          required: item.required,
        })),
      });
      console.log(`checklist: ${CHECKLIST.length} itens criados`);
    } else {
      console.log(`checklist: ja tinha ${templateCount} itens, mantido`);
    }

    // Sem membro, um GESTOR não enxerga nada e um OPERADOR não recebe as
    // atividades sem responsável. Vincular os ADMINs existentes dá um ponto
    // de partida sem inventar usuário.
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", active: true } });
    for (const admin of admins) {
      await prisma.departmentMember.upsert({
        where: { departmentId_userId: { departmentId: department.id, userId: admin.id } },
        update: { manager: true },
        create: { departmentId: department.id, userId: admin.id, manager: true },
      });
      console.log(`membro do Financeiro: ${admin.name}`);
    }

    const defaultAssignee = admins[0] ?? null;

    const bankAccounts = await prisma.bankAccount.findMany({
      include: { company: { select: { name: true } } },
    });
    if (bankAccounts.length === 0) {
      console.log("\nNenhuma conta bancaria cadastrada — nenhum contrato criado.");
      console.log("Cadastre contas em /admin/empresas/[id]/bancos e rode este seed de novo.");
      return;
    }

    // Vigência começa hoje: o gerador não produz atividade retroativa.
    const startsOn = new Date();
    startsOn.setUTCHours(0, 0, 0, 0);

    for (const account of bankAccounts) {
      const contract = await prisma.serviceContract.upsert({
        where: {
          companyId_serviceId_bankAccountId: {
            companyId: account.companyId,
            serviceId: service.id,
            bankAccountId: account.id,
          },
        },
        update: {},
        create: {
          companyId: account.companyId,
          serviceId: service.id,
          bankAccountId: account.id,
          recurrenceType: "SEMANAL",
          weekday: 1, // segunda-feira
          months: [],
          deadlineTime: "12:00",
          adjustment: "POSTERGAR",
          targetOffsetDays: 1,
          assigneeId: defaultAssignee?.id ?? null,
          startsOn,
        },
      });
      console.log(
        `contrato: ${account.company.name} / ${account.bankName} ag ${account.agency} cc ${account.accountNumber} [${contract.id}]`
      );
    }

    console.log("\nConcluido. Rode `npm run atividades:gerar` para materializar as atividades.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
