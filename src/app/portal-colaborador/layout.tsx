import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import { loadCompanyBrand } from "@/lib/brand";
import { PortalNav } from "@/components/layout/portal-nav";
import { RodapePortal, TemaPortal } from "@/components/portal/tema-portal";

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

  const brand = await loadCompanyBrand(session.user.companyId);

  return (
    <TemaPortal>
      <PortalNav
        title="Portal do Colaborador"
        userName={session?.user?.name ?? ""}
        brand={brand}
        avatarUrl={getAvatarUrl(user?.avatarPath ?? null)}
        links={[
          { href: "/portal-colaborador", label: "Início", exact: true },
          { href: "/portal-colaborador/documentos", label: "Meus documentos" },
          { href: "/portal-colaborador/ferias", label: "Férias" },
          { href: "/portal-colaborador/perfil", label: "Meu perfil" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">{children}</main>
      <RodapePortal />
    </TemaPortal>
  );
}
