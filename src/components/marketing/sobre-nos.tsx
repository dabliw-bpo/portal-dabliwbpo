import { Compass, Handshake, ListChecks, Target, UserFocus } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "./reveal";

/**
 * Seção "Sobre nós".
 *
 * A biografia usa só o que a DABLIW já afirma em público. Missão, visão e
 * valores são propostas de texto, para a DABLIW aprovar antes de publicar.
 *
 * SISTEMAS: lista dos sistemas que a DABLIW utiliza ou sabe usar. Enquanto
 * estiver vazia, o bloco não aparece na página. Só preencher com sistemas
 * confirmados pela DABLIW: não inventar nem citar sistema que não usamos.
 */
const SISTEMAS: string[] = [];

const BIOGRAFIA = [
  "A DABLIW BPO é um BPO de Financeiro e RH. Gerenciamos o financeiro das empresas de forma terceirizada e cuidamos da burocracia dos documentos do RH, para quem toca o negócio focar no que importa.",
  "Uma única equipe cuida dos dois departamentos, com atendimento direto: você fala com quem cuida da sua conta. Os documentos ficam num portal digital, onde cada colaborador tem acesso próprio e assina holerites e contratos no celular.",
  "Trabalhamos junto com o contador de cada empresa: enviamos os documentos todo mês e esclarecemos as dúvidas com ele.",
];

const PILARES = [
  {
    icon: Target,
    title: "Missão",
    text: "Assumir a rotina do financeiro e do RH das empresas, com organização e atendimento direto, para que cada empresário possa focar no que importa.",
  },
  {
    icon: Compass,
    title: "Visão",
    text: "Ser o parceiro de confiança das empresas que preferem cuidar do próprio negócio.",
  },
];

const VALORES = [
  {
    icon: ListChecks,
    title: "Clareza",
    text: "Dizemos o que fazemos, sem jargão e sem promessa que não podemos cumprir.",
  },
  {
    icon: UserFocus,
    title: "Proximidade",
    text: "Atendimento direto, com nome e rosto, sem central de atendimento automática.",
  },
  {
    icon: ListChecks,
    title: "Organização",
    text: "Cada documento, processo e histórico no lugar certo, prontos para uso.",
  },
  {
    icon: Handshake,
    title: "Responsabilidade",
    text: "Cuidamos de cada detalhe da rotina como se fosse nossa.",
  },
];

export function SobreNos() {
  return (
    <section id="sobre" className="mx-auto max-w-[1100px] px-6 py-24 sm:px-10 lg:px-6">
      <Reveal>
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px w-8 bg-[#c9a96e]" />
          <span className="text-[13px] font-medium uppercase tracking-[0.25em] text-[#c9a96e]">Sobre nós</span>
        </div>
        <h2 className="max-w-3xl font-[family-name:var(--font-display)] text-3xl font-medium leading-[1.15] text-[#f0ece4] sm:text-4xl lg:text-5xl">
          Quem cuida da rotina da sua <em className="italic text-[#c9a96e]">empresa</em>.
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
        <Reveal>
          <div className="flex flex-col gap-5 text-base leading-[1.85] text-[#a8a295]">
            {BIOGRAFIA.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-6">
          {PILARES.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.1}>
              <div className="h-full rounded-xl border border-[rgba(201,169,110,0.12)] bg-[#1c1a15] p-7">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                  <item.icon size={20} />
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium text-[#f0ece4]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a8a295]">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal>
        <h3 className="mt-20 font-[family-name:var(--font-display)] text-2xl font-medium text-[#f0ece4] sm:text-3xl">
          Nossos valores
        </h3>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-9 sm:grid-cols-2">
        {VALORES.map((item, i) => (
          <Reveal key={item.title} delay={(i % 2) * 0.1}>
            <div className="flex gap-4">
              <item.icon size={22} className="mt-1 shrink-0 text-[#c9a96e]" />
              <div>
                <h4 className="text-base font-medium text-[#f0ece4]">{item.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#a8a295]">{item.text}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {SISTEMAS.length > 0 && (
        <Reveal>
          <h3 className="mt-20 font-[family-name:var(--font-display)] text-2xl font-medium text-[#f0ece4] sm:text-3xl">
            Sistemas que utilizamos ou sabemos usar
          </h3>
          <ul className="mt-8 flex flex-wrap gap-3">
            {SISTEMAS.map((nome) => (
              <li
                key={nome}
                className="border border-[rgba(201,169,110,0.25)] px-5 py-2.5 text-sm text-[#a8a295]"
              >
                {nome}
              </li>
            ))}
          </ul>
        </Reveal>
      )}
    </section>
  );
}
