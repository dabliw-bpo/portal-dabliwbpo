import Link from "next/link";
import { signOut } from "@/lib/auth";

type NavLink = { href: string; label: string };

export function PortalNav({
  title,
  userName,
  links,
}: {
  title: string;
  userName: string;
  links: NavLink[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-8">
          <span className="text-sm font-semibold text-slate-900">{title}</span>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{userName}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-slate-500 underline hover:text-slate-900"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
