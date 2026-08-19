import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { CompanyRegistrationValues } from "@/components/companies/company-registration-fields";
import { CompanyLogoForm } from "@/components/companies/company-logo-form";
import { DeleteCompanyForm } from "@/components/companies/delete-company-form";
import { getCompanyLogoUrl } from "@/lib/avatar";
import { CompanyTabs } from "../company-tabs";
import { CadastroForm } from "./cadastro-form";

/** Dates are stored at UTC midnight, so the ISO date part is the local date. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EmpresaCadastroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, bankAccounts: true, paymentReceipts: true } },
    },
  });

  const documentCount = company
    ? await prisma.document.count({ where: { owner: { companyId: id } } })
    : 0;

  if (!company) {
    notFound();
  }

  const values: CompanyRegistrationValues = {
    name: company.name,
    cnpj: company.cnpj ?? "",
    tradeName: company.tradeName ?? "",
    openingDate: toDateInput(company.openingDate),
    branchType: company.branchType ?? "",
    legalNature: company.legalNature ?? "",
    companySize: company.companySize ?? "",
    mainActivity: company.mainActivity ?? "",
    secondaryActivities: company.secondaryActivities ?? "",
    street: company.street ?? "",
    streetNumber: company.streetNumber ?? "",
    complement: company.complement ?? "",
    district: company.district ?? "",
    city: company.city ?? "",
    state: company.state ?? "",
    zipCode: company.zipCode ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    brandColor: company.brandColor ?? "",
    cardStyle: company.cardStyle ?? "",
    partnerName: company.partnerName ?? "",
    partnerEmail: company.partnerEmail ?? "",
    federalEntity: company.federalEntity ?? "",
    registrationStatus: company.registrationStatus ?? "",
    registrationStatusDate: toDateInput(company.registrationStatusDate),
    registrationStatusReason: company.registrationStatusReason ?? "",
    specialStatus: company.specialStatus ?? "",
    specialStatusDate: toDateInput(company.specialStatusDate),
  };

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      {company.cnpj && <p className="mt-1 text-sm text-slate-500">CNPJ: {company.cnpj}</p>}

      <CompanyTabs companyId={id} active="cadastro" />

      <CompanyLogoForm
        companyId={id}
        companyName={company.name}
        logoUrl={getCompanyLogoUrl(company.logoPath)}
      />

      <CadastroForm companyId={id} values={values} />

      <DeleteCompanyForm
        companyId={id}
        companyName={company.name}
        counts={{
          people: company._count.users,
          documents: documentCount,
          receipts: company._count.paymentReceipts,
          bankAccounts: company._count.bankAccounts,
        }}
      />
    </div>
  );
}
