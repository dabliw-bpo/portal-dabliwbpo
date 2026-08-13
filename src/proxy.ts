import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { shouldForcePasswordChange } from "@/lib/paths";

const SECTION_ROLES = {
  "/admin": ["ADMIN"],
  "/atividades": ["ADMIN", "GESTOR", "OPERADOR"],
  "/portal-rh": ["COMPANY_HR"],
  "/portal-colaborador": ["COLLABORATOR"],
  "/portal-cliente": ["CLIENT"],
} as const;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const section = (Object.keys(SECTION_ROLES) as Array<keyof typeof SECTION_ROLES>).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!section) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoles: readonly string[] = SECTION_ROLES[section];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.redirect(new URL(homePathForRole(session.user.role), req.nextUrl.origin));
  }

  if (
    shouldForcePasswordChange({
      method: req.method,
      mustChangePassword: session.user.mustChangePassword,
      pathname,
    })
  ) {
    return NextResponse.redirect(new URL("/alterar-senha", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/portal-cliente/:path*",
    "/portal-colaborador/:path*",
    "/portal-rh/:path*",
    "/admin/:path*",
    "/atividades/:path*",
  ],
};
