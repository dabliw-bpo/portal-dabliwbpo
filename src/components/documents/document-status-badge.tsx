import type { DocumentStatus } from "@prisma/client";

const STYLES: Record<DocumentStatus, string> = {
  PENDING_SIGNATURE:
    "bg-amber-100 text-amber-800 portal:bg-ouro/10 portal:text-ouro-claro portal:ring-ouro/35",
  SIGNED:
    "bg-emerald-100 text-emerald-800 portal:bg-salvia/10 portal:text-salvia portal:ring-salvia/30",
  ARCHIVED: "bg-slate-100 text-slate-600 portal:bg-cartao portal:text-areia portal:ring-fio-forte",
};

const LABELS: Record<DocumentStatus, string> = {
  PENDING_SIGNATURE: "Pendente de assinatura",
  SIGNED: "Assinado",
  ARCHIVED: "Arquivado",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium portal:px-3 portal:tracking-wide portal:ring-1 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
