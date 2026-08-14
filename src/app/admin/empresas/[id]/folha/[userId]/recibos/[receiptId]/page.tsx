import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centsToInput, formatCents } from "@/lib/format";
import { buttonSecondary } from "@/components/ui/styles";
import { CollaboratorTabs, loadCollaborator } from "../../collaborator-tabs";
import { ReciboEditor } from "./recibo-editor";

export default async function ReciboPage({
  params,
}: {
  params: Promise<{ id: string; userId: string; receiptId: string }>;
}) {
  const { id, userId, receiptId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  const receipt = await prisma.paymentReceipt.findFirst({
    where: { id: receiptId, companyId: id, collaboratorUserId: userId },
  });

  if (!receipt) {
    notFound();
  }

  const base = `/admin/empresas/${id}/folha/${userId}`;

  return (
    <div>
      <Link href={`${base}/recibos`} className="text-sm text-slate-500 underline hover:text-slate-700">
        ← {company.name} / {user.name} / Recibos
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Recibo de {formatCents(receipt.amountCents)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {receipt.description} · emitido em {receipt.issuedAt.toLocaleDateString("pt-BR")}
          </p>
        </div>
        <Link
          href={`${base}/recibos/${receipt.id}/imprimir`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonSecondary}
        >
          Imprimir
        </Link>
      </div>

      <CollaboratorTabs companyId={id} userId={userId} active="recibos" />

      <ReciboEditor
        receipt={{
          id: receipt.id,
          description: receipt.description,
          amountInput: centsToInput(receipt.amountCents),
          companySignatureImage: receipt.companySignatureImage,
          collaboratorSignatureImage: receipt.collaboratorSignatureImage,
        }}
      />
    </div>
  );
}
