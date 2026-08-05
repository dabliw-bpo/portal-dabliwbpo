import Link from "next/link";
import { auth } from "@/lib/auth";
import { listPendingWork } from "@/lib/pending";
import { formatDateOnly } from "@/lib/format";

function SectionCard({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {count > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            {count}
          </span>
        )}
      </header>
      {count === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-slate-100">{children}</ul>
      )}
    </section>
  );
}

export default async function AdminPage() {
  const session = await auth();
  const { vacations, documents } = await listPendingWork();

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">
        Bem-vindo, {session?.user?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Papel: {session?.user?.role}</p>

      <div className="mt-6 flex flex-col gap-6">
        <SectionCard
          title="Férias aguardando revisão"
          count={vacations.length}
          emptyMessage="Nenhuma solicitação de férias pendente."
        >
          {vacations.map((request) => (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="text-sm">
                <p className="font-medium text-slate-900">{request.collaborator.name}</p>
                <p className="text-slate-600">
                  {request.collaborator.company?.name ?? "Sem empresa"} ·{" "}
                  {formatDateOnly(request.startDate)} a {formatDateOnly(request.endDate)}
                </p>
              </div>
              <Link
                href={`/admin/ferias/${request.id}?returnTo=${encodeURIComponent("/admin")}`}
                className="text-sm text-slate-900 underline hover:text-slate-700"
              >
                Revisar
              </Link>
            </li>
          ))}
        </SectionCard>

        <SectionCard
          title="Documentos aguardando assinatura"
          count={documents.length}
          emptyMessage="Nenhum documento pendente de assinatura."
        >
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="text-sm">
                <p className="font-medium text-slate-900">{document.title}</p>
                <p className="text-slate-600">
                  {document.owner.company?.name ?? "Sem empresa"} · aguardando{" "}
                  {document.owner.name} desde{" "}
                  {document.createdAt.toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Link
                href={`/admin/documentos/${document.id}`}
                className="text-sm text-slate-900 underline hover:text-slate-700"
              >
                Abrir
              </Link>
            </li>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
