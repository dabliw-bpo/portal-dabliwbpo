import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChartLineUp,
  ChatCircle,
  Check,
  Briefcase,
  FileText,
  Handshake,
  LockKey,
  UsersThree,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { displayFont, bodyFont } from "./fonts";
import { Reveal } from "./reveal";
import { MobileNav } from "./mobile-nav";
import { PortalStory } from "./portal-story";

const WHATSAPP_HREF = `https://wa.me/5565992536122?text=${encodeURIComponent(
  "Olá! Quero saber mais sobre os serviços da DABLIW BPO."
)}`;

const NAV_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#portal", label: "Portal" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#contato", label: "Contato" },
];

const FINANCEIRO_ITEMS = [
  "Contas a pagar e a receber",
  "Conciliação bancária e fechamento",
  "Análises e relatórios financeiros",
  "Consultoria financeira",
];

const RH_ITEMS = [
  "Admissões e rescisões",
  "Férias e afastamentos",
  "Folha de pagamento e holerites",
  "Documentação trabalhista",
];

const STEPS = [
  {
    title: "Diagnóstico",
    desc: "Entendemos como funciona hoje o financeiro e o RH da sua empresa.",
  },
  {
    title: "Organização",
    desc: "Documentos, processos e histórico entram no portal, prontos para uso.",
  },
  {
    title: "Operação",
    desc: "Financeiro e RH passam a rodar no dia a dia, com suporte direto.",
  },
];

const PONTOS_VENDA = [
  {
    icon: Handshake,
    title: "Uma equipe, dois departamentos",
    desc: "Financeiro e RH com o mesmo parceiro, sem repassar informação entre fornecedores diferentes.",
  },
  {
    icon: FileText,
    title: "A rotina organizada",
    desc: "Documentos, processos e histórico entram no portal, prontos para uso.",
  },
  {
    icon: ChatCircle,
    title: "Fale com quem cuida da sua conta",
    desc: "Atendimento direto, sem central de atendimento automática.",
  },
];

const DIFERENCIAIS = [
  {
    icon: Handshake,
    title: "Um parceiro, dois departamentos resolvidos",
    desc: "Financeiro e RH tratados pela mesma equipe, sem repassar informação entre fornecedores diferentes.",
  },
  {
    icon: FileText,
    title: "Documentos e assinaturas digitais",
    desc: "Holerites e contratos assinados no portal, sem papel perdido nem cobrança manual.",
  },
  {
    icon: LockKey,
    title: "Acesso próprio para cada colaborador",
    desc: "Cada colaborador enxerga só o que é dele, com login próprio.",
  },
  {
    icon: Briefcase,
    title: "Trabalhamos junto com o seu contador",
    desc: "Enviamos os documentos todo mês e esclarecemos as dúvidas com ele.",
  },
  {
    icon: ChatCircle,
    title: "Atendimento direto",
    desc: "Você fala com quem cuida da sua conta, sem central de atendimento automática.",
  },
];

export function LandingPage() {
  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[#0f0e0b] font-[family-name:var(--font-body)] font-light text-[#f0ece4] antialiased [letter-spacing:0.01em]`}
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(201,169,110,0.12)] bg-[#0f0e0b]/85 backdrop-blur-xl">
        <div className="relative mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 sm:px-10 lg:px-16">
          <a href="#hero" aria-label="DABLIW BPO, início">
            <Image
              src="/icone-redes-sociais.svg"
              alt="DABLIW BPO"
              width={56}
              height={56}
              priority
              className="h-14 w-14 rounded-full"
            />
          </a>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="group relative text-[13px] font-medium uppercase tracking-[0.12em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                <span className="mr-1 font-[family-name:var(--font-display)] italic text-[#c9a96e] opacity-0 transition-opacity group-hover:opacity-100">
                  [
                </span>
                {link.label}
                <span className="ml-1 font-[family-name:var(--font-display)] italic text-[#c9a96e] opacity-0 transition-opacity group-hover:opacity-100">
                  ]
                </span>
              </a>
            ))}
            <Link
              href="/portal"
              className="border border-[#8a7548] px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#c9a96e] transition-colors hover:bg-[#c9a96e] hover:text-[#0f0e0b]"
            >
              Acessar Portal
            </Link>
          </nav>

          <MobileNav />
        </div>
      </header>

      <main>
        {/* ABERTURA: logo em movimento */}
        <section
          id="hero"
          className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:px-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 50% 36%, rgba(201,169,110,0.10) 0%, transparent 62%), radial-gradient(ellipse at 85% 90%, rgba(201,169,110,0.05) 0%, transparent 55%)",
            }}
          />
          <div className="relative w-[min(720px,86vw)]" style={{ aspectRatio: "975 / 233" }}>
            <Image
              src="/logo-dabliw-bpo-completa.svg"
              alt="DABLIW BPO, Financeiro e RH"
              fill
              priority
              className="dw-logo-anim object-contain"
            />
            <div aria-hidden className="dw-logo-brilho" />
          </div>

          <Reveal delay={1.4} className="relative mt-14 max-w-3xl">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium leading-[1.15] text-[#f0ece4] sm:text-4xl lg:text-5xl">
              O financeiro e o RH da sua empresa, sem <em className="italic text-[#c9a96e]">estresse</em>.
            </h1>
          </Reveal>

          <a
            href="#para-sua-empresa"
            aria-label="Ir para a próxima seção"
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#706b61] transition-colors hover:text-[#c9a96e]"
          >
            Role
            <span className="dw-float block h-8 w-px bg-[#c9a96e]/60" />
          </a>
        </section>

        {/* COPY DE VENDAS */}
        <section id="para-sua-empresa" className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10 lg:px-6">
          <Reveal>
            <div className="mb-5 flex items-center gap-4">
              <span className="h-px w-8 bg-[#c9a96e]" />
              <span className="text-[13px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                Para quem toca uma empresa
              </span>
            </div>
            <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-medium leading-[1.15] text-[#f0ece4] sm:text-4xl lg:text-5xl">
              Seu financeiro e seu RH, nas mãos de quem <em className="italic text-[#c9a96e]">cuida</em> disso todos os
              dias.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-[1.8] text-[#a8a295]">
              Contas a pagar e a receber, conciliação, relatórios e consultoria financeira. Admissões, férias, folha e
              documentos do RH. Uma única equipe cuida de tudo, com atendimento direto.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-3">
            {PONTOS_VENDA.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.1}>
                <div className="flex gap-4">
                  <item.icon size={22} className="mt-1 shrink-0 text-[#c9a96e]" />
                  <div>
                    <h3 className="text-base font-medium text-[#f0ece4]">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#a8a295]">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-5">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#c9a96e] px-8 py-4 text-[14px] font-medium uppercase tracking-[0.12em] text-[#0f0e0b] transition-all hover:-translate-y-0.5 hover:bg-[#dfc596]"
              >
                <WhatsappLogo size={18} weight="fill" />
                Falar no WhatsApp
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center gap-2 text-[14px] font-normal uppercase tracking-[0.1em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                Ver o que fazemos
                <ArrowRight size={14} />
              </a>
            </div>
          </Reveal>
        </section>

        {/* SERVIÇOS */}
        <section id="servicos" className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10 lg:px-6">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[#f0ece4] sm:text-4xl">
                Financeiro e RH, num só lugar.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a8a295]">
                Da rotina financeira aos processos de RH, cuidamos de cada detalhe
                para sua empresa focar no que importa.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal>
              <div
                className="h-full rounded-xl border border-[rgba(201,169,110,0.12)] p-8"
                style={{
                  background:
                    "radial-gradient(ellipse at 100% 0%, rgba(201,169,110,0.08) 0%, transparent 55%), #1c1a15",
                }}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                  <ChartLineUp size={22} />
                </div>
                <h3 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-medium text-[#f0ece4]">
                  Financeiro
                </h3>
                <ul className="flex flex-col gap-3">
                  {FINANCEIRO_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#a8a295]">
                      <Check size={14} className="mt-1 shrink-0 text-[#c9a96e]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="h-full rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] p-8">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                  <UsersThree size={22} />
                </div>
                <h3 className="mb-5 font-[family-name:var(--font-display)] text-2xl font-medium text-[#f0ece4]">
                  Recursos Humanos
                </h3>
                <ul className="flex flex-col gap-3">
                  {RH_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[#a8a295]">
                      <Check size={14} className="mt-1 shrink-0 text-[#c9a96e]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PORTAL DIGITAL */}
        <section id="portal" className="mx-auto max-w-[1100px] px-6 pt-24 sm:px-10 lg:px-6">
          <Reveal>
            <div className="mb-4 flex items-center gap-4">
              <span className="h-px w-8 bg-[#c9a96e]" />
              <span className="text-[13px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                Portal Digital
              </span>
            </div>
            <h2 className="mb-5 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[#f0ece4] sm:text-4xl">
              Cada documento, ao alcance de um clique.
            </h2>
            <p className="mb-8 max-w-xl text-base leading-relaxed text-[#a8a295]">
              Holerites, admissões, férias e contratos organizados num portal só
              seu, com acesso separado para cada colaborador.
            </p>
            <Link
              href="/login?callbackUrl=/portal-colaborador"
              className="inline-flex items-center gap-2 text-[14px] font-normal uppercase tracking-[0.1em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
            >
              Portal do Colaborador
              <ArrowRight size={14} />
            </Link>
          </Reveal>
        </section>
        <PortalStory />

        {/* COMO FUNCIONA */}
        <section
          id="como-funciona"
          className="border-y border-[rgba(201,169,110,0.12)] bg-[#161510] px-6 py-24 sm:px-10 lg:px-16"
        >
          <div className="mx-auto max-w-[1100px]">
            <Reveal>
              <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-medium text-[#f0ece4] sm:text-4xl">
                Como funciona na prática
              </h2>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal key={step.title} delay={i * 0.1}>
                  <div className="flex flex-col gap-4">
                    <span className="font-[family-name:var(--font-display)] text-2xl italic leading-[1.1] text-[#c9a96e]">
                      0{i + 1}
                    </span>
                    <h3 className="text-lg font-medium text-[#f0ece4]">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-[#a8a295]">{step.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10 lg:px-6">
          <Reveal>
            <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-medium text-[#f0ece4] sm:text-4xl">
              O que muda com a DABLIW BPO
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
            {DIFERENCIAIS.map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 0.1}>
                <div className="flex gap-4">
                  <item.icon size={22} className="mt-1 shrink-0 text-[#c9a96e]" />
                  <div>
                    <h3 className="text-base font-medium text-[#f0ece4]">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#a8a295]">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* "Sobre nós" está pronto em ./sobre-nos.tsx, mas inativo até a DABLIW aprovar o texto e informar os sistemas. */}

        {/* CONTATO */}
        <section
          id="contato"
          className="border-t border-[rgba(201,169,110,0.12)] bg-[#161510] px-6 py-28 text-center sm:px-10"
        >
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[#f0ece4] sm:text-4xl lg:text-5xl">
              Vamos organizar o financeiro e o RH da sua empresa?
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#a8a295]">
              Fale com a nossa equipe e entenda como a DABLIW BPO pode assumir
              essa rotina por você.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#c9a96e] px-8 py-4 text-[14px] font-medium uppercase tracking-[0.12em] text-[#0f0e0b] transition-all hover:-translate-y-0.5 hover:bg-[#dfc596]"
              >
                <WhatsappLogo size={18} weight="fill" />
                Falar no WhatsApp
              </a>
              <a
                href="mailto:gestao@dabliwbpo.com.br"
                className="text-[14px] font-normal text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                gestao@dabliwbpo.com.br
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Image src="/logo-dabliw-bpo.svg" alt="DABLIW BPO" width={190} height={44} className="h-11 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-[#706b61]">
              Financeiro e RH completos para empresas que preferem cuidar do
              próprio negócio.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-[#c9a96e]">
                Navegação
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#a8a295]">
                {NAV_LINKS.slice(0, 3).map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="transition-colors hover:text-[#c9a96e]">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-[#c9a96e]">
                Portal
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#a8a295]">
                <li>
                  <Link href="/login?callbackUrl=/portal-colaborador" className="transition-colors hover:text-[#c9a96e]">
                    Portal do Colaborador
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-medium uppercase tracking-[0.15em] text-[#c9a96e]">
                Contato
              </h4>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm text-[#a8a295]">
                <li>
                  <a href="mailto:gestao@dabliwbpo.com.br" className="transition-colors hover:text-[#c9a96e]">
                    gestao@dabliwbpo.com.br
                  </a>
                </li>
                <li>
                  <a
                    href={WHATSAPP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[#c9a96e]"
                  >
                    (65) 99253-6122
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/dabliwbpo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[#c9a96e]"
                  >
                    @dabliwbpo
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-[1280px] border-t border-[rgba(201,169,110,0.08)] pt-6 text-xs text-[#706b61]">
          © 2026 DABLIW BPO · dabliwbpo.com.br
        </div>
      </footer>
    </div>
  );
}
