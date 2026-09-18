import Link from "next/link";
import type { VacationStatus } from "@prisma/client";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { VacationStatusBadge } from "@/components/vacation/vacation-status-badge";

export type ItemFerias = {
  id: string;
  periodo: string;
  solicitadoEm: string;
  status: VacationStatus;
  documentId: string | null;
};

export function FeriasLista({ itens }: { itens: ItemFerias[] }) {
  if (itens.length === 0) {
    return (
      <div className="mt-10 border border-fio bg-cartao p-8">
        <p className="font-serifa text-2xl text-marfim">Nenhuma solicitação ainda.</p>
        <p className="mt-2 text-sm text-areia">
          Quando quiser tirar férias, peça por aqui. A empresa analisa e você acompanha nesta página.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-10 grid gap-px border border-fio bg-fio">
      {itens.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-4 bg-breu p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div>
            <p className="font-serifa text-2xl text-marfim">{item.periodo}</p>
            <p className="mt-1 text-xs text-areia">Solicitado em {item.solicitadoEm}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <VacationStatusBadge status={item.status} />
            {item.documentId && (
              <Link
                href={`/portal-colaborador/documentos/${item.documentId}`}
                className="group inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-ouro transition-colors hover:text-ouro-claro"
              >
                Abrir documento
                <ArrowRight
                  size={14}
                  aria-hidden
                  className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
