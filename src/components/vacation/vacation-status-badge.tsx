import type { VacationStatus } from "@prisma/client";

const STYLES: Record<VacationStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-red-100 text-red-800",
  DOCUMENT_GENERATED: "bg-emerald-100 text-emerald-800",
};

const LABELS: Record<VacationStatus, string> = {
  REQUESTED: "Aguardando análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  DOCUMENT_GENERATED: "Documento gerado",
};

export function VacationStatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
