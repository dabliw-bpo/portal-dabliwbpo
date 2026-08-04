import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";
import { getAvatarUrl } from "@/lib/avatar";
import { UsuariosTable } from "@/components/users/usuarios-table";
import { CompanyTabs } from "./company-tabs";

export default async function AdminEmpresaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { users: { orderBy: { name: "asc" } } },
  });

  if (!company) {
    notFound();
  }

  const rows = company.users.map((user) => ({
    ...user,
    company,
    avatarUrl: getAvatarUrl(user.avatarPath),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
          {company.cnpj && <p className="mt-1 text-sm text-slate-500">CNPJ: {company.cnpj}</p>}
        </div>
        <Link href={`/admin/empresas/${id}/pessoas/novo`} className={buttonPrimary}>
          Nova pessoa
        </Link>
      </div>

      <CompanyTabs companyId={id} active="pessoas" />

      <UsuariosTable
        users={rows}
        currentUserId={session.user.id}
        basePath="/admin/usuarios"
        showCompanyColumn={false}
        editRedirectTo={`/admin/empresas/${id}`}
        hubBasePath={`/admin/empresas/${id}/folha`}
      />
    </div>
  );
}
