import { signOut } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { NavDrawer } from "./nav-drawer";

type NavLinkItem = { href: string; label: string; exact?: boolean };

export function PortalNav({
  title,
  userName,
  avatarUrl = null,
  brand = null,
  links,
}: {
  title: string;
  userName: string;
  avatarUrl?: string | null;
  /** The signed-in user's own company, shown in place of the DABLIW mark. */
  brand?: { name: string; logoUrl: string | null } | null;
  links: NavLinkItem[];
}) {
  return (
    <header className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <NavDrawer
            title={title}
            links={links}
            signOutAction={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          />
          {brand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase public bucket, no loader configured
            <img
              src={brand.logoUrl}
              alt={brand.name}
              className="h-7 max-w-[150px] shrink-0 object-contain object-left"
            />
          ) : (
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              DABLIW<span className="text-[#6e5a35]"> BPO</span>
            </span>
          )}
          <span className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden />
          <span className="hidden text-sm text-slate-500 sm:block">{title}</span>
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
