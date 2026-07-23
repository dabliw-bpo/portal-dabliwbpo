import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VacationStatusBadge } from "@/components/vacation/vacation-status-badge";
import { formatDateOnly } from "@/lib/format";

export default async function PortalColaboradorFeriasPage() {
  const session = await auth();
  const requests = await prisma.vacationRequest.findMany({
    where: { collaboratorUserId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Minhas férias</h1>
        <Link
          href="/portal-colaborador/ferias/nova"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Solicitar férias
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Período</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Documento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((req) => (
              <tr key={req.id}>
                <td className="px-4 py-2 text-slate-900">
                  {formatDateOnly(req.startDate)} a {formatDateOnly(req.endDate)}
                </td>
                <td className="px-4 py-2">
                  <VacationStatusBadge status={req.status} />
                </td>
                <td className="px-4 py-2">
                  {req.documentId ? (
                    <Link
                      href={`/portal-colaborador/documentos/${req.documentId}`}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      Ver / assinar
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
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
