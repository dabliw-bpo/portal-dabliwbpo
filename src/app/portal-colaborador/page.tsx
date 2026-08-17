import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarBlank, FileText, PenNib, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Porta de entrada do colaborador. O que precisa de ação vem primeiro e em
 * destaque: assinar um documento é a única coisa que o portal pede dele, e
 * antes disso ficava escondida atrás de um item de menu.
 */
export default async function PortalColaboradorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const pendingCount = await prisma.document.count({
    where: { ownerUserId: session.user.id, status: "PENDING_SIGNATURE" },
  });

  const firstName = session.user.name?.trim().split(/\s+/)[0] ?? "";

  const cards = [
    {
      href: "/portal-colaborador/perfil",
      icon: UserCircle,
      title: "Meu perfil",
      description: "Seus dados e foto",
    },
    {
      href: "/portal-colaborador/documentos",
      icon: FileText,
      title: "Meus documentos",
      description: "Holerites, contratos e recibos",
    },
    {
      href: "/portal-colaborador/ferias",
      icon: CalendarBlank,
      title: "Férias",
      description: "Solicitar e acompanhar",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Bem-vindo, {firstName}</h1>
      <p className="mt-1 text-slate-500">O que você precisa está logo abaixo.</p>

      {pendingCount > 0 && (
        <Link
          href="/portal-colaborador/documentos"
          className="mt-6 flex items-center gap-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 transition-colors hover:bg-amber-100"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-200">
            <PenNib size={26} className="text-amber-900" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-semibold text-amber-900">
              {pendingCount === 1
                ? "Você tem 1 documento para assinar"
                : `Você tem ${pendingCount} documentos para assinar`}
            </span>
            <span className="mt-0.5 block text-sm text-amber-800">
              Toque aqui para abrir e assinar.
            </span>
          </span>
          <span aria-hidden className="text-2xl text-amber-900">
            →
          </span>
        </Link>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const highlight = card.href.endsWith("/documentos") && pendingCount > 0;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                <Icon size={24} className="text-slate-700" aria-hidden />
              </span>
              <span className="mt-3 flex items-center gap-2 text-base font-medium text-slate-900">
                {card.title}
                {highlight && (
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-900">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className="mt-0.5 text-sm text-slate-500">{card.description}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
