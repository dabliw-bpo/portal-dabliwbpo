"use client";

import { useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#portal", label: "Portal" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#contato", label: "Contato" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center text-[#f0ece4]"
      >
        {open ? <X size={22} /> : <List size={22} />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-t border-[rgba(201,169,110,0.12)] bg-[#0f0e0b]/98 px-6 py-6 backdrop-blur-xl">
          <nav className="flex flex-col gap-5">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium uppercase tracking-[0.12em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-fit items-center border border-[#8a7548] px-5 py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-[#c9a96e]"
            >
              Acessar Portal
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
