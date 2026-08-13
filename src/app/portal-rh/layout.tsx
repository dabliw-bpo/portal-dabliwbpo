import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { loadCompanyBrand } from "@/lib/brand";
import { PortalNav } from "@/components/layout/portal-nav";

export default async function PortalRhLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "COMPANY_HR") {
    redirect(homePathForRole(session.user.role));
  }

  const brand = await loadCompanyBrand(session.user.companyId);

  return (
    <div className="flex flex-1 flex-col">
      <PortalNav
        title="Portal do RH"
        userName={session?.user?.name ?? ""}
        brand={brand}
        links={[
          { href: "/portal-rh/colaboradores", label: "Colaboradores", exact: true },
          { href: "/portal-rh/documentos", label: "Documentos" },
        ]}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
