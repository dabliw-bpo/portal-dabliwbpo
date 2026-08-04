import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthzError, requireCompanyAccess } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { createId } from "@/lib/id";
import { buildAuthorizationUrl } from "@/lib/conta-azul";

const STATE_COOKIE = "ca_oauth_state";

export async function GET(request: Request) {
  const session = await auth();
  const companyId = new URL(request.url).searchParams.get("companyId");

  if (!companyId) {
    return NextResponse.json({ error: "companyId é obrigatório." }, { status: 400 });
  }

  try {
    requireCompanyAccess(session, companyId);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }

  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true } });
  if (!company) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
  }

  const state = `${companyId}.${createId()}`;
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/integracoes/conta-azul",
    maxAge: 600,
  });

  return NextResponse.redirect(buildAuthorizationUrl(state));
}
