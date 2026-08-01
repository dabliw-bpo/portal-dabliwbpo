import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VacationStatusBadge } from "@/components/vacation/vacation-status-badge";
import { formatDateOnly } from "@/lib/format";

export default async function AdminFeriasPage() {
  const requests = await prisma.vacationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { collaborator: true },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Solicitações de férias</h1>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Colaborador</th>
              <th scope="col" className="px-4 py-2 font-medium">Período</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
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
                      href={`/admin/ferias/${req.id}`}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      Revisar
                    </Link>
                  ) : (
                    <span className="text-slate-600">—</span>
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
