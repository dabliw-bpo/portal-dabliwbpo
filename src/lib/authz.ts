import { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function homePathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "COMPANY_HR":
      return "/portal-rh";
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

/**
 * ADMIN can act on any company. COMPANY_HR can only act on their own
 * company (companyId must match and be present on the session).
 */
export function requireCompanyAccess(session: Session | null, targetCompanyId: string | null): Session {
  const activeSession = requireSession(session);
  if (activeSession.user.role === "ADMIN") {
    return activeSession;
  }
  if (
    activeSession.user.role === "COMPANY_HR" &&
    activeSession.user.companyId &&
    activeSession.user.companyId === targetCompanyId
  ) {
    return activeSession;
  }
  throw new AuthzError("Sem permissão para acessar este recurso.");
}
