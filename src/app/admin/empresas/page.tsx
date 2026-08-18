import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";

export default async function AdminEmpresasPage() {
  const companies = await prisma.company.findMany({
    orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Empresas</h1>
        <Link href="/admin/empresas/novo" className={buttonPrimary}>
          Nova empresa
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Nome
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                CNPJ
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Pessoas vinculadas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((company) => (
              <tr key={company.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/empresas/${company.id}/cadastro`}
                    className="text-slate-900 underline hover:text-slate-700"
                  >
                    {company.name}
                  </Link>
                  {company.isHeadquarters && (
                    <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                      Matriz
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{company.cnpj ?? "-"}</td>
                <td className="px-4 py-2 text-slate-600">{company._count.users}</td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-600">
                  Nenhuma empresa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
