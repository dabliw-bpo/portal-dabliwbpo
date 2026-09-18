import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { loadCompanyBrand } from "@/lib/brand";
import { PortalNav } from "@/components/layout/portal-nav";
import { RodapePortal, TemaPortal } from "@/components/portal/tema-portal";

export default async function PortalClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "CLIENT") {
    redirect(homePathForRole(session.user.role));
  }

  const brand = await loadCompanyBrand(session.user.companyId);

  return (
    <TemaPortal>
      <PortalNav
        title="Portal do Cliente"
        userName={session?.user?.name ?? ""}
        brand={brand}
        links={[{ href: "/portal-cliente", label: "Meus documentos" }]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">{children}</main>
      <RodapePortal />
    </TemaPortal>
  );
}
