import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import { PortalNav } from "@/components/layout/portal-nav";

export default async function PortalColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "COLLABORATOR") {
    redirect(homePathForRole(session.user.role));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarPath: true },
  });

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav
        title="Portal do Colaborador"
        userName={session?.user?.name ?? ""}
        avatarUrl={getAvatarUrl(user?.avatarPath ?? null)}
        links={[
          { href: "/portal-colaborador", label: "Meu perfil", exact: true },
          { href: "/portal-colaborador/documentos", label: "Meus documentos" },
          { href: "/portal-colaborador/ferias", label: "Férias" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
