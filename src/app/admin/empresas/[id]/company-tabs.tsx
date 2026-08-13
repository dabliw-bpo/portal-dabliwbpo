import Link from "next/link";
import { countCompanyPending } from "@/lib/pending";

export async function CompanyTabs({
  companyId,
  active,
}: {
  companyId: string;
  /**
   * "servicos" continua aceito mesmo sem aba correspondente: a página existe e
   * ainda passa esse valor, mas o processo será revisto antes de voltar à
   * navegação.
   */
  active: "cadastro" | "bancos" | "servicos" | "pessoas" | "integracoes";
}) {
  // Vacation reviews and unsigned documents are both reached through Folha,
  // so the badge lives there.
  const pendingCount = await countCompanyPending(companyId);

  const tabs = [
    { key: "cadastro", label: "Cadastro", href: `/admin/empresas/${companyId}/cadastro` },
    { key: "bancos", label: "Dados bancários", href: `/admin/empresas/${companyId}/bancos` },
    { key: "pessoas", label: "Folha", href: `/admin/empresas/${companyId}` },
    { key: "integracoes", label: "Integrações", href: `/admin/empresas/${companyId}/integracoes` },
  ] as const;

  return (
    <div className="mt-4 flex gap-1 border-b border-slate-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
            active === tab.key
              ? "border-[#6e5a35] font-medium text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          {tab.label}
          {tab.key === "pessoas" && pendingCount > 0 && (
            <>
              <span
                aria-hidden
                className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900"
              >
                {pendingCount}
              </span>
              <span className="sr-only">
                {pendingCount === 1 ? "1 pendência" : `${pendingCount} pendências`}
              </span>
            </>
          )}
        </Link>
      ))}
    </div>
  );
}
