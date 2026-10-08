import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole, isInternalRole } from "@/lib/authz";
import { PortalNav } from "@/components/layout/portal-nav";

/**
 * Área da equipe interna do BPO. Diferente de `/admin`, que é exclusiva do
 * ADMIN, aqui entram também GESTOR e OPERADOR — quem de fato executa as
 * atividades. O `proxy.ts` já barra o acesso antes de chegar aqui; esta
 * checagem é a segunda camada, para o caso de a rota ser renderizada por
 * outro caminho.
 */
export default async function AtividadesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (!isInternalRole(session.user.role)) {
    redirect(homePathForRole(session.user.role));
  }

  const links = [{ href: "/atividades", label: "Atividades", exact: true }];
  if (session.user.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin", exact: false });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav title="Operação" userName={session.user.name ?? ""} links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
