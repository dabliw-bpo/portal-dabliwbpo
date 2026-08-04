import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BankAccountsPanel } from "@/components/companies/bank-accounts-panel";
import { CompanyTabs } from "../company-tabs";

export default async function EmpresaBancosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { bankAccounts: { orderBy: { createdAt: "asc" } } },
  });

  if (!company) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Dados bancários</p>

      <CompanyTabs companyId={id} active="bancos" />

      <BankAccountsPanel companyId={id} accounts={company.bankAccounts} />
    </div>
  );
}
