import type { Prisma } from "@prisma/client";
import { INTERNAL_ROLES } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Quem pode receber uma atividade: a equipe interna ativa e os colaboradores
 * ativos cadastrados na Matriz. Os colaboradores executam o que lhes foi
 * atribuído pela tela "Minhas atividades", sem mudar de papel — continuam com
 * o portal do colaborador (holerites, recibos, assinaturas).
 */
export const ASSIGNABLE_USERS: Prisma.UserWhereInput = {
  active: true,
  OR: [
    { role: { in: [...INTERNAL_ROLES] } },
    { role: "COLLABORATOR", company: { isHeadquarters: true } },
  ],
};

export async function listAssignableUsers(): Promise<Array<{ id: string; name: string }>> {
  const users = await prisma.user.findMany({
    where: ASSIGNABLE_USERS,
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
  return users.map((user) => ({
    id: user.id,
    name: user.role === "COLLABORATOR" ? `${user.name} (colaborador)` : user.name,
  }));
}
