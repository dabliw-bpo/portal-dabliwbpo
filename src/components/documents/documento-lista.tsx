import Link from "next/link";
import type { Document } from "@prisma/client";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";

/** "2026-08" -> "08/2026" */
function monthLabel(value: string | null): string {
  if (!value) return "-";
  const [year, month] = value.split("-");
  return year && month ? `${month}/${year}` : value;
}

/**
 * Documents belonging to one collaborator, as shown in the payroll hub. The
 * "Competência" column only makes sense for payslips, so it is opt-in.
 */
export function DocumentoLista({
  documents,
  showReferenceMonth = false,
  emptyMessage,
}: {
  documents: (Document & { signature: { signedAt: Date } | null })[];
  showReferenceMonth?: boolean;
  emptyMessage: string;
}) {
  const columnCount = showReferenceMonth ? 4 : 3;

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            {showReferenceMonth && (
              <th scope="col" className="px-4 py-2 font-medium">
                Competência
              </th>
            )}
            <th scope="col" className="px-4 py-2 font-medium">
              Documento
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Enviado em
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Assinatura
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((document) => (
            <tr key={document.id}>
              {showReferenceMonth && (
                <td className="px-4 py-2 text-slate-900">{monthLabel(document.referenceMonth)}</td>
              )}
              <td className="px-4 py-2">
                <Link
                  href={`/admin/documentos/${document.id}`}
                  className="text-slate-900 underline hover:text-slate-700"
                >
                  {document.title}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-600">
                {document.createdAt.toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-2">
                {document.signature ? (
                  <span className="text-slate-600">
                    Assinado em {document.signature.signedAt.toLocaleDateString("pt-BR")}
                  </span>
                ) : (
                  <DocumentStatusBadge status={document.status} />
                )}
              </td>
            </tr>
          ))}
          {documents.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-4 py-6 text-center text-slate-600">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
