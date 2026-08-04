import Link from "next/link";

export function CompanyTabs({
  companyId,
  active,
}: {
  companyId: string;
  active: "cadastro" | "bancos" | "pessoas" | "documentos" | "ferias" | "integracoes";
}) {
  const tabs = [
    { key: "cadastro", label: "Cadastro", href: `/admin/empresas/${companyId}/cadastro` },
    { key: "bancos", label: "Dados bancários", href: `/admin/empresas/${companyId}/bancos` },
    { key: "pessoas", label: "Pessoas", href: `/admin/empresas/${companyId}` },
    { key: "documentos", label: "Documentos", href: `/admin/empresas/${companyId}/documentos` },
    { key: "ferias", label: "Férias", href: `/admin/empresas/${companyId}/ferias` },
    { key: "integracoes", label: "Integrações", href: `/admin/empresas/${companyId}/integracoes` },
  ] as const;

  return (
    <div className="mt-4 flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`border-b-2 px-3 py-2 text-sm transition-colors ${
            active === tab.key
              ? "border-[#6e5a35] font-medium text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
