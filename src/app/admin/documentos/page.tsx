import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DocumentStatusBadge } from "@/components/documents/document-status-badge";
import { buttonPrimary } from "@/components/ui/styles";

const TYPE_LABELS: Record<string, string> = {
  CONTRACT: "Contrato",
  VACATION_REQUEST: "Férias",
  OTHER: "Outro",
};

export default async function AdminDocumentosPage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Documentos</h1>
        <Link
          href="/admin/documentos/novo"
          className={buttonPrimary}
        >
          Novo documento
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Título</th>
              <th scope="col" className="px-4 py-2 font-medium">Destinatário</th>
              <th scope="col" className="px-4 py-2 font-medium">Tipo</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/documentos/${doc.id}`}
                    className="text-slate-900 underline hover:text-slate-700"
                  >
                    {doc.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{doc.owner.name}</td>
                <td className="px-4 py-2 text-slate-600">{TYPE_LABELS[doc.type]}</td>
                <td className="px-4 py-2">
                  <DocumentStatusBadge status={doc.status} />
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                  Nenhum documento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
