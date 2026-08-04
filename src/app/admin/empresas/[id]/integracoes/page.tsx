import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthzError, requireCompanyAccess } from "@/lib/authz";
import { buttonGhost, buttonPrimary } from "@/components/ui/styles";
import { formatDateOnly } from "@/lib/format";
import { ContaAzulStatusBadge } from "@/components/companies/conta-azul-status-badge";
import { disconnectContaAzulAction } from "@/lib/actions/conta-azul";
import { CompanyTabs } from "../company-tabs";

export default async function AdminEmpresaIntegracoesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ conta_azul?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const { conta_azul: contaAzulFeedback } = await searchParams;

  try {
    requireCompanyAccess(session, id);
  } catch (error) {
    if (error instanceof AuthzError) {
      redirect("/admin");
    }
    throw error;
  }

  const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!company) {
    notFound();
  }

  const integration = await prisma.contaAzulIntegration.findUnique({ where: { companyId: id } });

  return (
    <div>
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      </div>

      <CompanyTabs companyId={id} active="integracoes" />

      <div className="mt-6 max-w-xl rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-900">Conta Azul</h2>
            <p className="mt-1 text-sm text-slate-500">
              Conecte a conta Conta Azul desta empresa para permitir a futura conciliação bancária.
            </p>
          </div>
          <ContaAzulStatusBadge status={integration ? "connected" : "not_connected"} />
        </div>

        {contaAzulFeedback === "erro" && (
          <p className="mt-3 text-sm text-red-600">
            Não foi possível concluir a conexão com o Conta Azul. Tente novamente.
          </p>
        )}
        {contaAzulFeedback === "conectado" && (
          <p className="mt-3 text-sm text-emerald-600">Conta Azul conectado com sucesso.</p>
        )}

        <div className="mt-4">
          {integration ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Conectado desde {formatDateOnly(integration.connectedAt)}.</p>
              <form action={disconnectContaAzulAction.bind(null, id)}>
                <button type="submit" className={buttonGhost}>
                  Desconectar
                </button>
              </form>
            </div>
          ) : (
            <Link href={`/api/integracoes/conta-azul/connect?companyId=${id}`} className={buttonPrimary}>
              Conectar ao Conta Azul
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
