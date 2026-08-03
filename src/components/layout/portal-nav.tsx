import { signOut } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { NavLink } from "./nav-link";

type NavLinkItem = { href: string; label: string; exact?: boolean };

export function PortalNav({
  title,
  userName,
  avatarUrl = null,
  links,
}: {
  title: string;
  userName: string;
  avatarUrl?: string | null;
  links: NavLinkItem[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold tracking-tight text-slate-900">
            DABLIW<span className="text-[#6e5a35]"> BPO</span>
          </span>
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="hidden text-sm text-slate-500 sm:block">{title}</span>
          <nav className="flex gap-5">
            {links.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} exact={link.exact} />
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Avatar name={userName || "?"} src={avatarUrl} size={24} />
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
