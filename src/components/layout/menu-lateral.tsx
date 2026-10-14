"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOut } from "@phosphor-icons/react/dist/ssr";

type NavLinkItem = { href: string; label: string; exact?: boolean };

/**
 * Menu lateral fixo das áreas internas (admin e operação). Fica sempre à vista
 * a partir de telas médias e acompanha a rolagem; no celular quem aparece é a
 * gaveta aberta pelo botão do cabeçalho, porque ali não há largura sobrando.
 */
export function MenuLateral({
  title,
  links,
  signOutAction,
}: {
  title: string;
  links: NavLinkItem[];
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const isActive = (link: NavLinkItem) =>
    link.exact ? pathname === link.href : pathname.startsWith(link.href);

  return (
    <aside
      aria-label={`Menu ${title}`}
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col self-start border-r border-slate-200 bg-white md:flex print:hidden"
    >
      <div className="border-b border-slate-100 px-4 py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          {title}
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive(link) ? "page" : undefined}
            className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
              isActive(link)
                ? "bg-slate-100 font-medium text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <form action={signOutAction} className="border-t border-slate-100 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <SignOut size={18} aria-hidden />
          Sair
        </button>
      </form>
    </aside>
  );
}
