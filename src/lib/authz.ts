import { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function homePathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COLLABORATOR":
      return "/portal-colaborador";
    case "CLIENT":
      return "/portal-cliente";
  }
}

export class AuthzError extends Error {}

export function requireSession(session: Session | null): Session {
  if (!session) {
    throw new AuthzError("Não autenticado.");
  }
  return session;
}

export function requireRole(session: Session | null, roles: Role[]): Session {
  const activeSession = requireSession(session);
  if (!roles.includes(activeSession.user.role)) {
    throw new AuthzError("Sem permissão para esta ação.");
  }
  return activeSession;
}

export function requireOwnerOrAdmin(session: Session | null, ownerUserId: string): Session {
  const activeSession = requireSession(session);
  if (activeSession.user.role === "ADMIN" || activeSession.user.id === ownerUserId) {
    return activeSession;
  }
  throw new AuthzError("Sem permissão para acessar este recurso.");
}
