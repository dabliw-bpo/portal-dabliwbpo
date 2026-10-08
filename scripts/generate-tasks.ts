import { loadEnvConfig } from "@next/env";

// Este projeto guarda os segredos em `.env.local`, que só o Next carrega
// sozinho. Fora do runtime do Next é preciso pedir explicitamente — mesmo
// motivo pelo qual `prisma.config.ts` faz esta chamada.
loadEnvConfig(process.cwd());

async function main() {
  const { generateTasks } = await import("../src/lib/tasks/generate");

  const horizonArg = process.argv.find((arg) => arg.startsWith("--horizonte="));
  const horizonDays = horizonArg ? Number(horizonArg.split("=")[1]) : undefined;

  if (horizonArg && !Number.isFinite(horizonDays)) {
    console.error("Horizonte inválido. Use --horizonte=30.");
    process.exit(1);
  }

  const result = await generateTasks({ horizonDays });

  console.log(`Execução ${result.runId}`);
  console.log(`  criadas:  ${result.tasksCreated}`);
  console.log(`  puladas:  ${result.tasksSkipped}`);
  if (result.errors.length > 0) {
    console.log("  avisos:");
    for (const error of result.errors) {
      console.log(`    - ${error}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/prisma");
    await prisma.$disconnect();
  });
