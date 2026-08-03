import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COMPANY_HR: "RH da empresa",
  COLLABORATOR: "Colaborador",
  CLIENT: "Cliente",
};

export default async function AdminEmpresaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({
    where: { id },
    include: { users: { orderBy: { name: "asc" } } },
  });

  if (!company) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      {company.cnpj && <p className="mt-1 text-sm text-slate-500">CNPJ: {company.cnpj}</p>}

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-slate-500">
        Pessoas vinculadas
      </h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Nome
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Email
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Papel
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {company.users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/usuarios/${user.id}/editar`}
                    className="text-slate-900 underline hover:text-slate-700"
                  >
                    {user.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[user.role]}</td>
              </tr>
            ))}
            {company.users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-600">
                  Nenhuma pessoa vinculada a esta empresa ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
