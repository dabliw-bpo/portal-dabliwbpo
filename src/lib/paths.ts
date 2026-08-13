/**
 * Guards for the `returnTo`/`redirectTo` values that flow through forms, so a
 * crafted value cannot bounce a user off-site after an action completes.
 */

/** The admin dashboard itself, or any page under it. */
export function isAdminPath(value: unknown): value is string {
  return typeof value === "string" && (value === "/admin" || value.startsWith("/admin/"));
}

/**
 * Whether a request should be bounced to the forced password change.
 *
 * Only navigations are gated. Server Actions POST to the URL of the page they
 * live on, and redirecting one returns a 307, which the browser replays as a
 * POST against the redirect target: the action never runs and the user sees
 * nothing happen. Actions re-check authorization themselves, so letting them
 * through is safe.
 */
export function shouldForcePasswordChange({
  method,
  mustChangePassword,
  pathname,
}: {
  method: string;
  mustChangePassword: boolean;
  pathname: string;
}): boolean {
  return method === "GET" && mustChangePassword && pathname !== "/alterar-senha";
}

/**
 * Where a given user reads one of their own documents, or null when the role
 * has no document view — so an email can omit the link rather than point at a
 * page the recipient would be bounced out of.
 */
export function documentPathForRole(role: string, documentId: string): string | null {
  switch (role) {
    case "ADMIN":
      return `/admin/documentos/${documentId}`;
    case "COMPANY_HR":
      return `/portal-rh/documentos/${documentId}`;
    case "COLLABORATOR":
      return `/portal-colaborador/documentos/${documentId}`;
    case "CLIENT":
      return `/portal-cliente/documentos/${documentId}`;
    default:
      return null;
  }
}
