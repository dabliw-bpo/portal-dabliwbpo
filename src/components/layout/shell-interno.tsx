import { signOut } from "@/lib/auth";
import { MenuLateral } from "./menu-lateral";
import { PortalNav } from "./portal-nav";

type NavLinkItem = { href: string; label: string; exact?: boolean };

/**
 * Moldura das áreas internas do BPO (admin e operação): cabeçalho no alto e
 * menu lateral fixo ao lado do conteúdo. Os portais de cliente, colaborador e
 * RH seguem com o cabeçalho e a gaveta, que é o desenho deles.
 */
export function ShellInterno({
  title,
  userName,
  links,
  larguraMaxima = "max-w-5xl",
  children,
}: {
  title: string;
  userName: string;
  links: NavLinkItem[];
  larguraMaxima?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalNav title={title} userName={userName} links={links} menuLateralFixo />
      <div className="flex flex-1">
        <MenuLateral
          title={title}
          links={links}
          signOutAction={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        />
        <main className={`mx-auto w-full min-w-0 flex-1 px-4 py-8 ${larguraMaxima}`}>{children}</main>
      </div>
    </div>
  );
}
