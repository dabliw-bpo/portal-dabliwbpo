import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

/**
 * O documento esperando assinatura, desenhado como uma folha sobre a mesa.
 * É a única superfície clara do portal, então é para onde o olho vai primeiro
 * — e assinar é o que o colaborador veio fazer.
 */
export function FolhaPendente({
  href,
  titulo,
  enviadoEm,
}: {
  href: string;
  titulo: string;
  enviadoEm: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${titulo}, enviado em ${enviadoEm}. Abrir para assinar.`}
      className="group flex h-full flex-col bg-marfim px-6 pb-5 pt-6 text-breu shadow-[0_22px_45px_-22px_rgba(0,0,0,0.85)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_32px_60px_-24px_rgba(0,0,0,0.95)] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ouro motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ouro-tinta">
        Enviado em {enviadoEm}
      </span>
      <span className="mt-2 font-serifa text-[26px] font-semibold leading-[1.1]">{titulo}</span>
      <span className="mt-auto flex items-end gap-3 pt-8">
        <span aria-hidden className="font-serifa text-xl italic leading-none text-ouro-tinta">
          ×
        </span>
        <span aria-hidden className="mb-1 h-px flex-1 bg-breu/25" />
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-ouro-tinta">
          Assinar
          <ArrowRight
            size={14}
            weight="bold"
            aria-hidden
            className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
          />
        </span>
      </span>
    </Link>
  );
}
