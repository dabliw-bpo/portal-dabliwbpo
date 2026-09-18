import type { VacationStatus } from "@prisma/client";

const STYLES: Record<VacationStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800 portal:bg-ouro/10 portal:text-ouro-claro portal:ring-ouro/35",
  APPROVED: "bg-sky-100 text-sky-800 portal:bg-marfim/5 portal:text-marfim portal:ring-fio-forte",
  REJECTED: "bg-red-100 text-red-800 portal:bg-terracota/10 portal:text-terracota portal:ring-terracota/30",
  DOCUMENT_GENERATED:
    "bg-emerald-100 text-emerald-800 portal:bg-salvia/10 portal:text-salvia portal:ring-salvia/30",
};

const LABELS: Record<VacationStatus, string> = {
  REQUESTED: "Aguardando análise",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  DOCUMENT_GENERATED: "Documento gerado",
};

export function VacationStatusBadge({ status }: { status: VacationStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium portal:px-3 portal:tracking-wide portal:ring-1 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
