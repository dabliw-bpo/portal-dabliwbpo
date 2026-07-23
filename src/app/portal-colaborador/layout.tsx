import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
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

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav
        title="Portal do Colaborador"
        userName={session?.user?.name ?? ""}
        links={[
          { href: "/portal-colaborador", label: "Meus documentos" },
          { href: "/portal-colaborador/ferias", label: "Férias" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
