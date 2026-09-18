import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { Sobrelinha } from "@/components/portal/sobrelinha";
import { NovaSolicitacaoForm } from "./nova-solicitacao-form";

export default function NovaSolicitacaoFeriasPage() {
  return (
    <div>
      <Link
        href="/portal-colaborador/ferias"
        className="group inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-areia transition-colors hover:text-ouro"
      >
        <ArrowLeft
          size={14}
          aria-hidden
          className="transition-transform group-hover:-translate-x-1 motion-reduce:transition-none"
        />
        Minhas férias
      </Link>
      <div className="mt-10">
        <Sobrelinha>Férias</Sobrelinha>
        <h1 className="mt-5 font-serifa text-5xl font-medium leading-none text-marfim sm:text-6xl">
          Solicitar férias
        </h1>
        <p className="mt-5 max-w-md text-areia">
          Escolha quantos dias e o primeiro dia. A empresa analisa e, se aprovar, o acordo chega aqui
          para você assinar.
        </p>
      </div>
      <NovaSolicitacaoForm />
    </div>
  );
}
