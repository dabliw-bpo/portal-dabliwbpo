type ContaAzulStatus = "connected" | "not_connected";

const STYLES: Record<ContaAzulStatus, string> = {
  connected: "bg-emerald-100 text-emerald-800",
  not_connected: "bg-slate-100 text-slate-600",
};

const LABELS: Record<ContaAzulStatus, string> = {
  connected: "Conectado",
  not_connected: "Não conectado",
};

export function ContaAzulStatusBadge({ status }: { status: ContaAzulStatus }) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STYLES[status]}`}>{LABELS[status]}</span>
  );
}
