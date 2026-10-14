import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";
import { getAvatarUrl } from "@/lib/avatar";
import { loadCompanyAlerts } from "@/lib/company-alerts";
import {
  PendenciasEmpresa,
  parseFiltroPendencias,
} from "@/components/companies/pendencias-empresa";
import { UsuariosTable } from "@/components/users/usuarios-table";
import { CompanyTabs } from "./company-tabs";

export default async function AdminEmpresaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const filtro = parseFiltroPendencias((await searchParams).filtro);
  const [company, [alerts]] = await Promise.all([
    prisma.company.findUnique({
      where: { id },
      include: { users: { orderBy: { name: "asc" } } },
    }),
    loadCompanyAlerts(id),
  ]);

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

      {alerts && <PendenciasEmpresa alerts={alerts} filtro={filtro} />}

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
