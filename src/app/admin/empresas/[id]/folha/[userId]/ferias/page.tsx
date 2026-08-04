import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VacationStatusBadge } from "@/components/vacation/vacation-status-badge";
import { formatDateOnly } from "@/lib/format";
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "../collaborator-tabs";

export default async function ColaboradorFeriasPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  const requests = await prisma.vacationRequest.findMany({
    where: { collaboratorUserId: userId },
    orderBy: { createdAt: "desc" },
  });

  const returnTo = `/admin/empresas/${id}/folha/${userId}/ferias`;

  return (
    <div>
      <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
      <CollaboratorTabs companyId={id} userId={userId} active="ferias" />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Período
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Solicitado em
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
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-2 text-slate-900">
                  {formatDateOnly(request.startDate)} a {formatDateOnly(request.endDate)}
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {request.createdAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-2">
                  <VacationStatusBadge status={request.status} />
                </td>
                <td className="px-4 py-2">
                  {request.status === "REQUESTED" ? (
                    <Link
                      href={`/admin/ferias/${request.id}?returnTo=${encodeURIComponent(returnTo)}`}
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
                  Nenhuma solicitação de férias ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
