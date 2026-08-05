/**
 * Guards for the `returnTo`/`redirectTo` values that flow through forms, so a
 * crafted value cannot bounce a user off-site after an action completes.
 */

/** The admin dashboard itself, or any page under it. */
export function isAdminPath(value: unknown): value is string {
  return typeof value === "string" && (value === "/admin" || value.startsWith("/admin/"));
}
