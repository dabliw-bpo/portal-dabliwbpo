import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";

/**
 * Endereço divulgado do portal: dabliwbpo.com.br/portal.
 *
 * Serve só para separar o institucional (na raiz) da área logada. Quem já
 * tem sessão cai direto na própria área, em vez de ver um login que não
 * precisa; quem não tem, vai entrar.
 */
export default async function PortalEntryPage() {
  const session = await auth();

  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  redirect("/login");
}
