import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VacationStatusBadge } from "@/components/vacation/vacation-status-badge";
import { formatDateOnly } from "@/lib/format";
import { CompanyTabs } from "../company-tabs";

export default async function EmpresaFeriasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });

  if (!company) {
    notFound();
  }

  const requests = await prisma.vacationRequest.findMany({
    where: { collaborator: { companyId: id } },
    orderBy: { createdAt: "desc" },
    include: { collaborator: true },
  });

  const returnTo = `/admin/empresas/${id}/ferias`;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">{company.name}</h1>
      <p className="mt-1 text-sm text-slate-500">Solicitações de férias</p>

      <CompanyTabs companyId={id} active="ferias" />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Colaborador
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Período
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-4 py-2 text-slate-900">{req.collaborator.name}</td>
                <td className="px-4 py-2 text-slate-600">
                  {formatDateOnly(req.startDate)} a {formatDateOnly(req.endDate)}
                </td>
                <td className="px-4 py-2">
                  <VacationStatusBadge status={req.status} />
                </td>
                <td className="px-4 py-2">
                  {req.status === "REQUESTED" ? (
                    <Link
                      href={`/admin/ferias/${req.id}?returnTo=${encodeURIComponent(returnTo)}`}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      Revisar
                    </Link>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                  Nenhuma solicitação ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
