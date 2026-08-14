import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "../collaborator-tabs";
import { NovoReciboForm } from "./novo-recibo-form";

function signatureState(receipt: {
  companySignatureImage: string | null;
  collaboratorSignatureImage: string | null;
}): { label: string; tone: string } {
  const signed =
    Number(Boolean(receipt.companySignatureImage)) +
    Number(Boolean(receipt.collaboratorSignatureImage));

  if (signed === 2) return { label: "Assinado", tone: "bg-emerald-100 text-emerald-800" };
  if (signed === 1) return { label: "1 de 2 assinaturas", tone: "bg-amber-100 text-amber-900" };
  return { label: "Sem assinaturas", tone: "bg-slate-100 text-slate-600" };
}

export default async function ColaboradorRecibosPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  const receipts = await prisma.paymentReceipt.findMany({
    where: { collaboratorUserId: userId },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
      <CollaboratorTabs companyId={id} userId={userId} active="recibos" />

      <NovoReciboForm companyId={id} userId={userId} />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                Emitido em
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Descrição
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Valor
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                Assinaturas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {receipts.map((receipt) => {
              const status = signatureState(receipt);
              return (
                <tr key={receipt.id}>
                  <td className="px-4 py-2 text-slate-600">
                    {receipt.issuedAt.toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/admin/empresas/${id}/folha/${userId}/recibos/${receipt.id}`}
                      className="text-slate-900 underline hover:text-slate-700"
                    >
                      {receipt.description}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-medium tabular-nums text-slate-900">
                    {formatCents(receipt.amountCents)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {receipts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  Nenhum recibo emitido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
