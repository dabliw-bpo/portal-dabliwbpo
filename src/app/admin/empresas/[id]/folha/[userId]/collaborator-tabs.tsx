import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/**
 * Loads a person and asserts they belong to the company in the URL, so a
 * collaborator can never be reached through another company's hub.
 */
export async function loadCollaborator(companyId: string, userId: string) {
  const [company, user] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!company || !user || user.companyId !== companyId) {
    notFound();
  }

  return { company, user };
}

export function CollaboratorTabs({
  companyId,
  userId,
  active,
}: {
  companyId: string;
  userId: string;
  active: "cadastro" | "holerites" | "ferias" | "documentos";
}) {
  const base = `/admin/empresas/${companyId}/folha/${userId}`;
  const tabs = [
    { key: "cadastro", label: "Cadastro", href: base },
    { key: "holerites", label: "Holerite mensal", href: `${base}/holerites` },
    { key: "ferias", label: "Férias", href: `${base}/ferias` },
    { key: "documentos", label: "Outros documentos", href: `${base}/documentos` },
  ] as const;

  return (
    <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
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

export function CollaboratorHeader({
  companyId,
  companyName,
  userName,
}: {
  companyId: string;
  companyName: string;
  userName: string;
}) {
  return (
    <div>
      <Link
        href={`/admin/empresas/${companyId}`}
        className="text-sm text-slate-500 underline hover:text-slate-700"
      >
        ← {companyName} / Folha
      </Link>
      <h1 className="mt-2 text-lg font-semibold text-slate-900">{userName}</h1>
    </div>
  );
}
