import Link from "next/link";
import { ArrowRight, CalendarBlank, FileText, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/marketing/reveal";
import { FolhaPendente } from "./folha-pendente";
import { Sobrelinha } from "./sobrelinha";

export type Pendente = { id: string; titulo: string; enviadoEm: string };

// Na tela inicial cabem poucas folhas; o resto fica a um clique, na lista.
const FOLHAS_NO_INICIO = 4;

const ATALHOS = [
  {
    href: "/portal-colaborador/documentos",
    Icone: FileText,
    titulo: "Meus documentos",
    descricao: "Holerites, recibos e contratos",
  },
  {
    href: "/portal-colaborador/ferias",
    Icone: CalendarBlank,
    titulo: "Férias",
    descricao: "Solicitar e acompanhar",
  },
  {
    href: "/portal-colaborador/perfil",
    Icone: UserCircle,
    titulo: "Meu perfil",
    descricao: "Seus dados e foto",
  },
];

/**
 * A porta de entrada do colaborador. O que espera a assinatura dele é a tese
 * da página: as folhas vêm logo depois do cumprimento, antes de qualquer menu.
 */
export function InicioColaborador({
  primeiroNome,
  hoje,
  pendentes,
}: {
  primeiroNome: string;
  hoje: string;
  pendentes: Pendente[];
}) {
  const total = pendentes.length;
  const visiveis = pendentes.slice(0, FOLHAS_NO_INICIO);
  const restantes = total - visiveis.length;

  return (
    <div>
      <Reveal>
        <Sobrelinha>{hoje}</Sobrelinha>
      </Reveal>
      <Reveal delay={0.06}>
        <h1 className="mt-5 font-serifa text-5xl font-medium leading-[1.02] text-marfim sm:text-6xl">
          Olá, {primeiroNome}.
        </h1>
      </Reveal>

      {total > 0 ? (
        <section aria-labelledby="inicio-pendentes" className="mt-14">
          <Reveal delay={0.14}>
            <h2
              id="inicio-pendentes"
              className="flex items-baseline gap-3 font-serifa text-2xl leading-snug text-marfim sm:text-3xl"
            >
              <span
                aria-hidden
                className="dw-pulso relative -top-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-ouro"
              />
              <span>
                {total === 1 ? (
                  "Um documento espera a sua assinatura."
                ) : (
                  <>
                    <em className="text-ouro">{total}</em> documentos esperam a sua assinatura.
                  </>
                )}
              </span>
            </h2>
          </Reveal>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {visiveis.map((doc, i) => (
              <Reveal key={doc.id} delay={0.2 + i * 0.07} className="h-full">
                <FolhaPendente
                  href={`/portal-colaborador/documentos/${doc.id}`}
                  titulo={doc.titulo}
                  enviadoEm={doc.enviadoEm}
                />
              </Reveal>
            ))}
          </div>
          {restantes > 0 && (
            <Link
              href="/portal-colaborador/documentos"
              className="group mt-6 inline-flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.16em] text-ouro transition-colors hover:text-ouro-claro"
            >
              {restantes === 1 ? "Ver mais 1 documento" : `Ver mais ${restantes} documentos`}
              <ArrowRight
                size={14}
                aria-hidden
                className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </Link>
          )}
        </section>
      ) : (
        <Reveal delay={0.14}>
          <section className="mt-14 border border-fio bg-cartao p-8">
            <p className="font-serifa text-3xl text-marfim">Tudo assinado.</p>
            <p className="mt-2 text-areia">
              Nenhum documento esperando por você. Quando chegar um novo, avisamos por e-mail.
            </p>
          </section>
        </Reveal>
      )}

      <Reveal delay={0.3}>
        <nav aria-label="Atalhos" className="mt-16 grid gap-px border border-fio bg-fio sm:grid-cols-3">
          {ATALHOS.map(({ href, Icone, titulo, descricao }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col bg-breu p-6 transition-colors hover:bg-cartao focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ouro"
            >
              <Icone size={26} weight="light" aria-hidden className="text-ouro" />
              <span className="mt-5 flex items-center justify-between gap-3 text-[15px] font-normal text-marfim">
                {titulo}
                <ArrowRight
                  size={16}
                  aria-hidden
                  className="text-pedra transition-[transform,color] group-hover:translate-x-1 group-hover:text-ouro motion-reduce:transition-none"
                />
              </span>
              <span className="mt-1 text-sm text-areia">{descricao}</span>
            </Link>
          ))}
        </nav>
      </Reveal>
    </div>
  );
}
