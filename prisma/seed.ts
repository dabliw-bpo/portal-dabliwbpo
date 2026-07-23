import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(params: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  return prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      passwordHash,
      role: params.role,
    },
  });
}

async function main() {
  await upsertUser({
    name: "Administrador",
    email: "admin@example.com",
    password: "senha123",
    role: Role.ADMIN,
  });
  await upsertUser({
    name: "Colaborador Teste",
    email: "colaborador@example.com",
    password: "senha123",
    role: Role.COLLABORATOR,
  });
  await upsertUser({
    name: "Cliente Teste",
    email: "cliente@example.com",
    password: "senha123",
    role: Role.CLIENT,
  });

  console.log("Seed concluído: admin@example.com / colaborador@example.com / cliente@example.com (senha: senha123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
