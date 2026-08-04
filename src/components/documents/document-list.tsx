import Link from "next/link";
import type { Document } from "@prisma/client";
import { DocumentStatusBadge } from "./document-status-badge";

const TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contrato",
  PAYSLIP: "Holerite",
  VACATION_REQUEST: "Férias",
  OTHER: "Outro",
};

export function DocumentList({
  documents,
  basePath,
}: {
  documents: Document[];
  basePath: string;
}) {
  if (documents.length === 0) {
    return <p className="mt-6 text-sm text-slate-600">Nenhum documento por aqui ainda.</p>;
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">Título</th>
            <th scope="col" className="px-4 py-2 font-medium">Tipo</th>
            <th scope="col" className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-4 py-2">
                <Link
                  href={`${basePath}/${doc.id}`}
                  className="text-slate-900 underline hover:text-slate-700"
                >
                  {doc.title}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-600">{TYPE_LABELS[doc.type]}</td>
              <td className="px-4 py-2">
                <DocumentStatusBadge status={doc.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
