import type { Prisma } from "@prisma/client";
import type { Session } from "next-auth";
import { AuthzError, isInternalRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

/**
 * Equipe da Matriz: usuário ativo cadastrado na empresa marcada como matriz.
 * Consulta o banco em vez de confiar na empresa gravada no token, que fica
 * velha se o cadastro mudar depois do login.
 */
export async function isHeadquartersStaff(userId: string): Promise<boolean> {
  const found = await prisma.user.findFirst({
    where: { id: userId, active: true, company: { isHeadquarters: true } },
    select: { id: true },
  });
  return found !== null;
}

/**
 * Recorte de leitura de atividades por papel:
 *
 * - ADMIN        enxerga tudo;
 * - GESTOR       enxerga os departamentos onde é `DepartmentMember.manager`;
 * - OPERADOR     enxerga as próprias atividades mais as que ainda não têm
 *                responsável dentro dos departamentos de que participa;
 * - COLABORADOR  da Matriz enxerga e executa só as atividades atribuídas a ele
 *                — não vê a fila, os departamentos nem a lista de empresas.
 *
 * Todos, exceto o ADMIN, só valem se estiverem cadastrados na Matriz (a
 * empresa marcada como `isHeadquarters`): é o cadastro na Matriz que dá à
 * equipe acesso às demandas das demais empresas. Quem está em outra empresa
 * não enxerga nada.
 *
 * Devolve um fragmento de `where` para ser combinado com os filtros da tela.
 * O recorte mora aqui, na camada de dados, e nunca só na UI — é o que impede
 * um operador de ler a carteira inteira mexendo na query string.
 */
export async function taskScopeFor(session: Session | null): Promise<Prisma.TaskWhereInput> {
  if (!session?.user) {
    throw new AuthzError("Não autenticado.");
  }
  const role = session.user.role;
  if (role !== "COLLABORATOR" && !isInternalRole(role)) {
    throw new AuthzError("Sem permissão para acessar atividades.");
  }

  if (role === "ADMIN") {
    return {};
  }

  if (!(await isHeadquartersStaff(session.user.id))) {
    throw new AuthzError("O acesso às empresas é da equipe cadastrada na Matriz.");
  }

  if (role === "COLLABORATOR") {
    return { assigneeId: session.user.id };
  }

  const memberships = await prisma.departmentMember.findMany({
    where: { userId: session.user.id },
    select: { departmentId: true, manager: true },
  });

  if (session.user.role === "GESTOR") {
    const managed = memberships.filter((m) => m.manager).map((m) => m.departmentId);
    // Gestor sem departamento atribuído não enxerga nada, em vez de enxergar tudo.
    return { departmentId: { in: managed } };
  }

  const departmentIds = memberships.map((m) => m.departmentId);
  return {
    OR: [
      { assigneeId: session.user.id },
      { assigneeId: null, departmentId: { in: departmentIds } },
    ],
  };
}

/**
 * Um operador só pode agir sobre a atividade que já é dele ou que está sem
 * responsável no seu departamento; gestor, sobre o departamento que gerencia.
 * Reaproveita o mesmo recorte da leitura para não haver duas verdades.
 */
export async function assertCanActOnTask(session: Session | null, taskId: string): Promise<Session> {
  const scope = await taskScopeFor(session);
  const found = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, scope] },
    select: { id: true },
  });
  if (!found) {
    throw new AuthzError("Sem permissão para acessar esta atividade.");
  }
  return session as Session;
}
