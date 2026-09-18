import type { ReactNode } from "react";

/** O rótulo com fio dourado do site ("— BPO Financeiro & RH"), para situar a página. */
export function Sobrelinha({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p
      id={id}
      className="flex items-center gap-3 text-[12px] font-medium uppercase tracking-[0.22em] text-ouro"
    >
      <span aria-hidden className="h-px w-7 shrink-0 bg-ouro" />
      {children}
    </p>
  );
}
