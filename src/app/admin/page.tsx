import Link from "next/link";
import { auth } from "@/lib/auth";
import { listPendingWork, loadDashboardStats } from "@/lib/pending";
import { listMonthBirthdays, todayInBrazil } from "@/lib/birthdays";
import { APP_TIME_ZONE, formatVacationPeriod } from "@/lib/format";
import { ResendAllButton } from "@/components/documents/resend-all-button";

// O reenvio em lote lê arquivos e envia anexos; precisa de mais que o padrão.
export const maxDuration = 60;

function StatTile({ label, value, href }: { label: string; value: number; href?: string }) {
  const body = (
    <>
      <span className="text-2xl font-semibold tabular-nums text-slate-900">{value}</span>
      <span className="mt-0.5 text-sm text-slate-500">{label}</span>
    </>
  );

  const shell = "flex flex-col rounded-lg border border-slate-200 bg-white px-4 py-3";

  return href ? (
    <Link href={href} className={`${shell} transition-colors hover:border-slate-300 hover:bg-slate-50`}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

/**
 * `needsAction` separates work waiting on someone from what is merely good to
 * know: without it a quiet month of birthdays looks as urgent as a signature
 * nobody has given.
 */
function SectionCard({
  title,
  count,
  emptyMessage,
  needsAction = false,
  action,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  needsAction?: boolean;
  /** Ação do cartão inteiro, à direita do título. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const flagged = needsAction && count > 0;

  return (
    <section
      className={`overflow-hidden rounded-lg border bg-white ${
        flagged ? "border-amber-300" : "border-slate-200"
      }`}
    >
      <header
        className={`flex items-center gap-2 border-b px-4 py-3 ${
          flagged ? "border-amber-200 bg-amber-50" : "border-slate-100"
        }`}
      >
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {count > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
              flagged ? "bg-amber-200 text-amber-900" : "bg-slate-100 text-slate-700"
            }`}
          >
            {count}
          </span>
        )}
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {count === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-slate-100">{children}</ul>
      )}
    </section>
  );
}

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export default async function AdminPage() {
  const session = await auth();
  const { vacations, documents } = await listPendingWork();
  const [birthdays, stats] = await Promise.all([listMonthBirthdays(), loadDashboardStats()]);
  const { month, day } = todayInBrazil();

  const firstName = session?.user?.name?.trim().split(/\s+/)[0] ?? "";
  const today = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Olá, {firstName}</h1>
      <p className="mt-1 text-sm text-slate-500 first-letter:uppercase">{today}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Empresas" value={stats.companies} href="/admin/empresas" />
        <StatTile label="Pessoas ativas" value={stats.activePeople} />
        <StatTile label="Aguardando ação" value={stats.pending} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <SectionCard
          title="Férias aguardando revisão"
          count={vacations.length}
          needsAction
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
                  {formatVacationPeriod(request)}
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
          needsAction
          action={documents.length > 0 ? <ResendAllButton /> : null}
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

        <SectionCard
          title={`Aniversariantes de ${MONTH_NAMES[month - 1]}`}
          count={birthdays.length}
          emptyMessage="Ninguém faz aniversário neste mês."
        >
          {birthdays.map((person) => {
            const isToday = person.day === day;
            return (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-9 shrink-0 rounded-md py-1 text-center text-xs font-semibold ${
                      isToday ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {String(person.day).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-medium text-slate-900">
                      {person.name}
                      {isToday && (
                        <span className="ml-2 text-xs font-normal text-amber-800">é hoje 🎉</span>
                      )}
                    </p>
                    <p className="text-slate-600">
                      {person.companyName ?? "Sem empresa"}
                      {person.turningAge !== null && ` · faz ${person.turningAge} anos`}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </SectionCard>
      </div>
    </div>
  );
}
