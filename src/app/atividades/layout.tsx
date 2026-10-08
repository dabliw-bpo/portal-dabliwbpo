import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole, isInternalRole } from "@/lib/authz";
import { isHeadquartersStaff } from "@/lib/tasks/scope";
import { PortalNav } from "@/components/layout/portal-nav";

/**
 * Área da equipe interna do BPO. Diferente de `/admin`, que é exclusiva do
 * ADMIN, aqui entram também GESTOR e OPERADOR — quem de fato executa as
 * atividades. O `proxy.ts` já barra o acesso antes de chegar aqui; esta
 * checagem é a segunda camada, para o caso de a rota ser renderizada por
 * outro caminho.
 *
 * O acesso às empresas vem do cadastro na Matriz: gestor ou operador que não
 * esteja nela vê o aviso abaixo em vez de uma tela vazia ou de um erro. Não há
 * redirecionamento porque a página inicial desses papéis é esta mesma área.
 *
 * Colaborador da Matriz também entra, só para executar o que lhe foi atribuído
 * ("Minhas atividades"); fora da Matriz, volta ao portal dele.
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
  const isCollaborator = session.user.role === "COLLABORATOR";
  if (!isCollaborator && !isInternalRole(session.user.role)) {
    redirect(homePathForRole(session.user.role));
  }

  const isAdmin = session.user.role === "ADMIN";
  const permitido = isAdmin || (await isHeadquartersStaff(session.user.id));
  if (isCollaborator && !permitido) {
    redirect(homePathForRole(session.user.role));
  }

  const links = isCollaborator
    ? [
        { href: "/atividades", label: "Minhas atividades", exact: true },
        { href: "/portal-colaborador", label: "Meu portal", exact: false },
      ]
    : [
        { href: "/atividades", label: "Atividades", exact: true },
        { href: "/atividades/empresas", label: "Empresas", exact: false },
      ];
  if (isAdmin) {
    links.push({ href: "/admin", label: "Admin", exact: false });
  }

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav
        title={isCollaborator ? "Minhas atividades" : "Operação"}
        userName={session.user.name ?? ""}
        links={links}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {permitido ? (
          children
        ) : (
          <div role="alert" className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Seu cadastro não está na Matriz, e o acesso às atividades e às empresas é da equipe
            cadastrada nela. Peça a um administrador para ajustar o seu cadastro.
          </div>
        )}
      </main>
    </div>
  );
}
