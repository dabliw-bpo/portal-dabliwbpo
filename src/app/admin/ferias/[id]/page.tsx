import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateOnly } from "@/lib/format";
import { isAdminPath } from "@/lib/paths";
import { ReviewForm } from "./review-form";

export default async function AdminRevisarFeriasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
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
        Revisar solicitação de {vacationRequest.collaborator.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {formatDateOnly(vacationRequest.startDate)} a {formatDateOnly(vacationRequest.endDate)}
      </p>
      {vacationRequest.notes && (
        <p className="mt-2 text-sm text-slate-600">Observações: {vacationRequest.notes}</p>
      )}

      {vacationRequest.status === "REQUESTED" ? (
        <ReviewForm
          requestId={vacationRequest.id}
          redirectTo={isAdminPath(returnTo) ? returnTo : undefined}
        />
      ) : (
        <p className="mt-6 text-sm text-slate-500">Esta solicitação já foi revisada.</p>
      )}
    </div>
  );
}
