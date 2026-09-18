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
  // O desfoque fica numa camada ::before, e não no próprio header: um
  // backdrop-filter no header viraria o contêiner da gaveta (position: fixed)
  // e a prenderia na altura da barra.
  return (
    <header className="border-b border-slate-200 bg-white print:hidden portal:sticky portal:top-0 portal:z-30 portal:border-fio portal:bg-transparent portal:before:absolute portal:before:inset-0 portal:before:-z-10 portal:before:bg-breu/85 portal:before:backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 portal:gap-4 portal:px-5 portal:py-3.5">
        <div className="flex items-center gap-3 portal:min-w-0">
          <NavDrawer
            title={title}
            links={links}
            signOutAction={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          />
          {brand?.logoUrl ? (
            // As logos são feitas para fundo branco; no portal escuro ganham
            // uma plaquinha marfim em vez de virar um retângulo branco solto.
            <span className="inline-flex shrink-0 items-center portal:bg-marfim portal:px-2 portal:py-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public bucket, no loader configured */}
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-7 max-w-[150px] shrink-0 object-contain object-left portal:h-6 portal:max-w-[120px]"
              />
            </span>
          ) : (
            <span className="text-sm font-semibold tracking-tight text-slate-900 portal:whitespace-nowrap portal:font-serifa portal:text-xl portal:font-medium portal:tracking-wide portal:text-marfim">
              DABLIW<span className="text-[#6e5a35] portal:text-ouro"> BPO</span>
            </span>
          )}
          <span className="hidden h-4 w-px bg-slate-200 sm:block portal:bg-fio-forte" aria-hidden />
          <span className="hidden text-sm text-slate-500 sm:block portal:text-[11px] portal:font-medium portal:uppercase portal:tracking-[0.22em] portal:text-areia">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-3 portal:shrink-0">
          <Avatar name={userName || "?"} src={avatarUrl} size={24} />
          <span className="text-sm text-slate-500 portal:hidden portal:text-areia portal:md:inline">
            {userName}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-slate-500 underline hover:text-slate-900 portal:text-[11px] portal:font-medium portal:uppercase portal:tracking-[0.18em] portal:text-areia portal:no-underline portal:hover:text-ouro"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
