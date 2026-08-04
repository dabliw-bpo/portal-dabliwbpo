import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { AuthzError, requireCompanyAccess } from "@/lib/authz";
import { connectCompany } from "@/lib/conta-azul";

const STATE_COOKIE = "ca_oauth_state";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  const companyId = savedState?.split(".")[0];
  if (!companyId) {
    return NextResponse.json({ error: "Sessão de autorização inválida ou expirada." }, { status: 400 });
  }

  const redirectBase = new URL(`/admin/empresas/${companyId}/integracoes`, request.url);

  if (oauthError || !code || !state || state !== savedState) {
    return NextResponse.redirect(`${redirectBase.toString()}?conta_azul=erro`);
  }

  const session = await auth();
  try {
    requireCompanyAccess(session, companyId);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.redirect(`${redirectBase.toString()}?conta_azul=erro`);
    }
    throw error;
  }

  try {
    await connectCompany(companyId, code);
  } catch {
    return NextResponse.redirect(`${redirectBase.toString()}?conta_azul=erro`);
  }

  return NextResponse.redirect(`${redirectBase.toString()}?conta_azul=conectado`);
}
