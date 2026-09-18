import Link from "next/link";
import type { ReactNode } from "react";
import { buttonGhost } from "@/components/ui/styles";
import { TemaPortal } from "./tema-portal";
import { Sobrelinha } from "./sobrelinha";

/**
 * A moldura das telas de acesso (entrar, esqueci a senha, nova senha): a
 * mesma mesa escura do site, com o cartão de fio dourado no centro.
 */
export function CartaoAcesso({
  titulo,
  descricao,
  children,
  voltar,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
  voltar: { href: string; rotulo: string };
}) {
  return (
    <TemaPortal className="items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="font-serifa text-2xl font-medium tracking-wide text-marfim transition-colors hover:text-ouro-claro"
        >
          DABLIW<span className="text-ouro"> BPO</span>
        </Link>

        <div className="mt-8 border border-fio-forte bg-cartao p-7 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)] sm:p-10">
          <Sobrelinha>Portal</Sobrelinha>
          <h1 className="mt-5 font-serifa text-4xl font-medium leading-tight text-marfim">{titulo}</h1>
          <p className="mt-3 text-sm text-areia">{descricao}</p>
          {children}
        </div>

        <div className="mt-6 flex justify-center">
          <Link href={voltar.href} className={buttonGhost}>
            <span aria-hidden>←</span> {voltar.rotulo}
          </Link>
        </div>
      </div>
    </TemaPortal>
  );
}
