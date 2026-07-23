import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/format";
import { ReviewForm } from "./review-form";

export default async function AdminRevisarFeriasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vacationRequest = await prisma.vacationRequest.findUnique({
    where: { id },
    include: { collaborator: true },
  });

  if (!vacationRequest) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">
        Revisar solicitação — {vacationRequest.collaborator.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {formatDateOnly(vacationRequest.startDate)} a {formatDateOnly(vacationRequest.endDate)}
      </p>
      {vacationRequest.notes && (
        <p className="mt-2 text-sm text-slate-600">Observações: {vacationRequest.notes}</p>
      )}

      {vacationRequest.status === "REQUESTED" ? (
        <ReviewForm requestId={vacationRequest.id} />
      ) : (
        <p className="mt-6 text-sm text-slate-500">Esta solicitação já foi revisada.</p>
      )}
    </div>
  );
}
