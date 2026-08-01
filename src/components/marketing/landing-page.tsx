import Link from "next/link";
import {
  ArrowRight,
  ChartLineUp,
  ChatCircle,
  Check,
  CheckCircle,
  FileText,
  Folder,
  Handshake,
  IdentificationBadge,
  LockKey,
  UsersThree,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { displayFont, bodyFont } from "./fonts";
import { Reveal } from "./reveal";
import { MobileNav } from "./mobile-nav";

const WHATSAPP_HREF = `https://wa.me/5565992536122?text=${encodeURIComponent(
  "Olá! Quero saber mais sobre os serviços da DABLIW BPO."
)}`;

const NAV_LINKS = [
  { href: "#servicos", label: "Serviços" },
  { href: "#portal", label: "Portal" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#contato", label: "Contato" },
];

const DOCUMENT_ROWS = [
  { label: "Holerite · Outubro 2026", status: "Assinado" },
  { label: "Recibo de Férias", status: "Disponível" },
  { label: "Admissão · Contrato", status: "Concluído" },
];

const FINANCEIRO_ITEMS = [
  "Contas a pagar e a receber",
  "Conciliação bancária e fechamento",
  "Cálculo e conferência de comissões",
  "Análises e relatórios financeiros",
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
    title: "Acesso separado por perfil",
    desc: "Clientes e colaboradores enxergam só o que é deles, com login próprio.",
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
          <a
            href="#hero"
            className="font-[family-name:var(--font-display)] text-xl font-medium tracking-wide text-[#f0ece4]"
          >
            DABLIW<span className="text-[#c9a96e]"> BPO</span>
          </a>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="border border-[#8a7548] px-5 py-2.5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#c9a96e] transition-colors hover:bg-[#c9a96e] hover:text-[#0f0e0b]"
            >
              Acessar Portal
            </Link>
          </nav>

          <MobileNav />
        </div>
      </header>

      <main>
        {/* HERO */}
        <section
          id="hero"
          className="relative mx-auto grid min-h-[100dvh] max-w-[1280px] grid-cols-1 pt-20 md:grid-cols-2"
        >
          <div className="flex flex-col justify-center px-6 py-16 sm:px-10 lg:px-16">
            <Reveal>
              <div className="mb-6 flex items-center gap-4">
                <span className="h-px w-8 bg-[#c9a96e]" />
                <span className="text-[13px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
                  BPO Financeiro &amp; RH
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mb-6 font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.12] text-[#f0ece4] sm:text-5xl lg:text-6xl">
                O financeiro e o RH da sua empresa, sem <em className="italic text-[#c9a96e]">estresse</em>.
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mb-10 max-w-[440px] text-lg leading-[1.8] text-[#a8a295]">
                Cuidamos de análises financeiras, folha de pagamento, admissões e
                muito mais, com um portal digital para acompanhar cada etapa.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#c9a96e] px-8 py-4 text-[14px] font-medium uppercase tracking-[0.12em] text-[#0f0e0b] transition-all hover:-translate-y-0.5 hover:bg-[#dfc596]"
                >
                  Falar no WhatsApp
                  <ArrowRight size={16} />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-[14px] font-normal uppercase tracking-[0.1em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
                >
                  Acessar Portal
                  <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="relative hidden items-center justify-center overflow-hidden bg-[#161510] md:flex">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(201,169,110,0.08) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, rgba(201,169,110,0.05) 0%, transparent 60%)",
              }}
            />
            <div
              aria-hidden
              className="absolute right-[10%] top-[15%] h-28 w-28 rounded-full border border-[rgba(201,169,110,0.12)]"
            />
            <div
              aria-hidden
              className="absolute bottom-[22%] left-[10%] h-14 w-14 rounded-full border border-[rgba(201,169,110,0.12)]"
            />

            <Reveal delay={0.3} className="relative w-[82%] max-w-[420px]">
              <div className="overflow-hidden rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] shadow-[0_25px_60px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-1.5 border-b border-[rgba(201,169,110,0.12)] bg-white/[0.03] px-4 py-3.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e06c60]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#e5bf4e]/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#61c354]/70" />
                  <span className="ml-auto text-[11px] tracking-wide text-[#706b61]">
                    portal-colaborador
                  </span>
                </div>
                <div className="flex flex-col gap-4 p-6">
                  {DOCUMENT_ROWS.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="shrink-0 text-[#706b61]" />
                        <span className="text-sm text-[#a8a295]">{row.label}</span>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#c9a96e]">
                        <CheckCircle size={14} weight="fill" />
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center text-xs uppercase tracking-[0.15em] text-[#706b61]">
                Prévia do Portal do Colaborador
              </p>
            </Reveal>
          </div>
        </section>

        {/* SERVIÇOS */}
        <section id="servicos" className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10 lg:px-6">
          <Reveal>
            <div className="mb-14 max-w-2xl">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-medium text-[#f0ece4] sm:text-4xl">
                Todo o financeiro e o RH, num só lugar.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a8a295]">
                Da rotina financeira aos processos de RH, cuidamos de cada detalhe
                para sua empresa focar no que importa.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal>
              <div className="h-full rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] p-8">
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
        <section
          id="portal"
          className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-24 sm:px-10 md:grid-cols-2 lg:px-16"
        >
          <Reveal className="order-2 md:order-1">
            <div className="grid gap-4">
              <div className="flex items-center gap-4 rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                  <Folder size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f0ece4]">Portal do Cliente</p>
                  <p className="text-xs text-[#706b61]">Documentos e relatórios da sua empresa, organizados.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                  <IdentificationBadge size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#f0ece4]">Portal do Colaborador</p>
                  <p className="text-xs text-[#706b61]">Holerites, férias e admissão em um só lugar.</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 md:order-2">
            <span className="mb-4 block text-[13px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">
              Portal Digital
            </span>
            <h2 className="mb-5 font-[family-name:var(--font-display)] text-3xl font-medium leading-tight text-[#f0ece4] sm:text-4xl">
              Cada documento, ao alcance de um clique.
            </h2>
            <p className="mb-8 max-w-md text-base leading-relaxed text-[#a8a295]">
              Holerites, admissões, férias e contratos organizados num portal só
              seu, com acesso separado para clientes e colaboradores.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <Link
                href="/login?callbackUrl=/portal-cliente"
                className="inline-flex items-center gap-2 text-[14px] font-normal uppercase tracking-[0.1em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                Portal do Cliente
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/login?callbackUrl=/portal-colaborador"
                className="inline-flex items-center gap-2 text-[14px] font-normal uppercase tracking-[0.1em] text-[#a8a295] transition-colors hover:text-[#c9a96e]"
              >
                Portal do Colaborador
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </section>

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
            <span className="font-[family-name:var(--font-display)] text-xl font-medium text-[#f0ece4]">
              DABLIW<span className="text-[#c9a96e]"> BPO</span>
            </span>
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
                  <Link href="/login?callbackUrl=/portal-cliente" className="transition-colors hover:text-[#c9a96e]">
                    Portal do Cliente
                  </Link>
                </li>
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
