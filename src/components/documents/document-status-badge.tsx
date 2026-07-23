import type { DocumentStatus } from "@prisma/client";

const STYLES: Record<DocumentStatus, string> = {
  PENDING_SIGNATURE: "bg-amber-100 text-amber-800",
  SIGNED: "bg-emerald-100 text-emerald-800",
  ARCHIVED: "bg-slate-100 text-slate-600",
};

const LABELS: Record<DocumentStatus, string> = {
  PENDING_SIGNATURE: "Pendente de assinatura",
  SIGNED: "Assinado",
  ARCHIVED: "Arquivado",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
