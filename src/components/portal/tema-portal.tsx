import type { ReactNode } from "react";
import { bodyFont, displayFont } from "@/components/marketing/fonts";

/**
 * A identidade do site institucional aplicada a quem entra pelo portal: a
 * mesma paleta e as mesmas fontes. Envolve os layouts do colaborador e do
 * cliente e as telas de acesso.
 */
export function TemaPortal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      // lining-nums: a Cormorant desenha algarismos de texto por padrão, e em
      // holerite, data e valor o número precisa ser lido de relance.
      className={`${displayFont.variable} ${bodyFont.variable} tema-portal flex flex-1 flex-col bg-breu font-texto font-light text-marfim antialiased [font-variant-numeric:lining-nums] ${className}`}
    >
      {children}
    </div>
  );
}

export function RodapePortal() {
  return (
    <footer className="border-t border-fio">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-xs text-areia sm:px-8">
        <span className="font-serifa text-base font-medium tracking-wide text-marfim">
          DABLIW<span className="text-ouro"> BPO</span>
        </span>
        <span>Financeiro e RH, sem estresse.</span>
      </div>
    </footer>
  );
}
