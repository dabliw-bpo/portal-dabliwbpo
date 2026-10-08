"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { CheckCircle, EnvelopeSimple, FileText } from "@phosphor-icons/react/dist/ssr";

/**
 * Passo a passo do portal que acompanha a rolagem da página.
 *
 * As telas são animações do próprio site, sem nenhuma informação real:
 * nada de nome, valor, CPF ou documento de verdade. Os textos descrevem o
 * que o portal faz hoje (aviso por e-mail, abrir o documento, assinar com o
 * dedo e guardar com assinatura, data e hora).
 */
const STEPS = [
  {
    title: "Chega um documento novo",
    desc: "O colaborador recebe um e-mail avisando que há um documento para ver.",
  },
  {
    title: "Abra no portal",
    desc: "Holerites, recibos e contratos ficam num só lugar, com login próprio.",
  },
  {
    title: "Assine com o dedo",
    desc: "Direto na tela do celular, sem imprimir nem escanear.",
  },
  {
    title: "Fica guardado",
    desc: "O documento é guardado com a assinatura, a data e a hora.",
  },
] as const;

const SCREEN_ITEMS = ["Holerite", "Recibo de férias", "Contrato de admissão"] as const;

function Bars({ widths }: { widths: number[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {widths.map((w, i) => (
        <span key={i} className="block h-2 rounded-full bg-[rgba(201,169,110,0.16)]" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

function SceneShell({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      aria-hidden={!active}
      className="absolute inset-0 flex flex-col p-5"
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 18, scale: active ? 1 : 0.98 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ pointerEvents: "none" }}
    >
      {children}
    </motion.div>
  );
}

function Phone({ step, sig }: { step: number; sig: MotionValue<number> | number }) {
  return (
    <div className="relative mx-auto h-[540px] w-[270px] rounded-[2.6rem] border border-[rgba(201,169,110,0.25)] bg-[#0f0e0b] p-2.5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] max-[420px]:h-[480px] max-[420px]:w-[240px]">
      <div className="absolute left-1/2 top-3.5 z-10 h-1.5 w-16 -translate-x-1/2 rounded-full bg-[#1c1a15]" />
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-[#161510]">
        {/* 1. chega o aviso */}
        <SceneShell active={step === 0}>
          <div className="mt-12 rounded-xl border border-[rgba(201,169,110,0.25)] bg-[#1c1a15] p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(201,169,110,0.25)] text-[#c9a96e]">
                <EnvelopeSimple size={18} />
              </span>
              <div className="flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#c9a96e]">DABLIW BPO</p>
                <p className="mt-0.5 text-xs text-[#f0ece4]">Você tem um documento novo</p>
              </div>
              <span className="dw-pulso h-2 w-2 rounded-full bg-[#c9a96e]" />
            </div>
            <div className="mt-4">
              <Bars widths={[88, 62]} />
            </div>
            <div className="mt-5 inline-flex bg-[#c9a96e] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#0f0e0b]">
              Abrir documento
            </div>
          </div>
        </SceneShell>

        {/* 2. lista do portal */}
        <SceneShell active={step === 1}>
          <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">Portal do Colaborador</p>
          <div className="mt-4 flex flex-col gap-3">
            {SCREEN_ITEMS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-lg border p-3 ${
                  i === 0 ? "border-[rgba(201,169,110,0.4)] bg-[#1c1a15]" : "border-[rgba(201,169,110,0.12)]"
                }`}
              >
                <FileText size={18} className="shrink-0 text-[#706b61]" />
                <span className="flex-1 text-xs text-[#a8a295]">{label}</span>
                {i === 0 && (
                  <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#c9a96e]">Novo</span>
                )}
              </div>
            ))}
          </div>
        </SceneShell>

        {/* 3. assinatura */}
        <SceneShell active={step === 2}>
          <p className="mt-12 text-[10px] font-medium uppercase tracking-[0.2em] text-[#c9a96e]">Documento</p>
          <div className="mt-4">
            <Bars widths={[92, 70, 84, 46]} />
          </div>
          <div className="relative mt-auto mb-4 h-28 border-b border-[#8a7548]">
            <span className="absolute bottom-2 left-0 font-[family-name:var(--font-display)] text-2xl italic text-[#c9a96e]">
              ×
            </span>
            <svg viewBox="0 0 220 110" className="absolute inset-0 h-full w-full" fill="none">
              <motion.path
                d="M30 78 C44 20 62 16 66 56 S84 98 100 48 S124 14 132 60 S152 86 168 40 C176 22 188 28 190 54 L212 50"
                stroke="#f0ece4"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: sig }}
              />
            </svg>
          </div>
        </SceneShell>

        {/* 4. guardado */}
        <SceneShell active={step === 3}>
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <motion.span
              initial={false}
              animate={{ scale: step === 3 ? 1 : 0.6 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="text-[#c9a96e]"
            >
              <CheckCircle size={64} weight="fill" />
            </motion.span>
            <p className="mt-4 text-sm font-medium text-[#f0ece4]">Assinado</p>
            <p className="mt-1 max-w-[180px] text-[11px] leading-relaxed text-[#a8a295]">
              Guardado com a assinatura, a data e a hora.
            </p>
            <div className="mt-6 w-full">
              <Bars widths={[80, 56]} />
            </div>
          </div>
        </SceneShell>
      </div>
    </div>
  );
}

export function PortalStory() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const sig = useTransform(scrollYProgress, [0.5, 0.72], [0, 1], { clamp: true });
  const glow = useTransform(scrollYProgress, [0, 1], ["20%", "80%"]);
  const glowBg = useTransform(
    glow,
    (g) => `radial-gradient(ellipse at 70% ${g}, rgba(201,169,110,0.09) 0%, transparent 60%)`
  );

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    setStep((prev) => (prev === next ? prev : next));
  });

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + range * ((i + 0.5) / STEPS.length),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  // Quem prefere menos movimento vê os quatro passos lado a lado, sem rolagem animada.
  if (reduce) {
    return (
      <div className="mx-auto grid max-w-[1100px] gap-12 px-6 pb-24 sm:grid-cols-2 sm:px-10 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <div key={s.title} className="flex flex-col items-center gap-6 text-center">
            <Phone step={i} sig={1} />
            <div>
              <h3 className="text-base font-medium text-[#f0ece4]">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#a8a295]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-[420vh]">
      <div className="sticky top-20 flex h-[calc(100dvh-5rem)] items-center overflow-hidden">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: glowBg }}
        />
        <div className="relative mx-auto grid w-full max-w-[1100px] grid-cols-1 items-center gap-6 px-6 sm:px-10 md:grid-cols-2 md:gap-14 lg:px-6">
          <div className="order-2 md:order-1">
            <ol className="flex flex-col gap-1">
              {STEPS.map((s, i) => {
                const active = i === step;
                return (
                  <li key={s.title}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={active ? "step" : undefined}
                      className="group flex w-full items-start gap-4 py-2.5 text-left md:py-3.5"
                    >
                      <span
                        className={`mt-1 font-[family-name:var(--font-display)] text-xl italic transition-colors ${
                          active ? "text-[#c9a96e]" : "text-[#706b61]"
                        }`}
                      >
                        0{i + 1}
                      </span>
                      <span className="flex-1">
                        <span
                          className={`block text-base font-medium transition-colors md:text-lg ${
                            active ? "text-[#f0ece4]" : "text-[#706b61] group-hover:text-[#a8a295]"
                          }`}
                        >
                          {s.title}
                        </span>
                        <span
                          className={`grid transition-all duration-500 ${
                            active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <span className="overflow-hidden text-sm leading-relaxed text-[#a8a295]">
                            <span className="block pt-1.5">{s.desc}</span>
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 hidden text-xs uppercase tracking-[0.15em] text-[#706b61] md:block">
              Role a página ou clique em um passo
            </p>
          </div>

          <div className="order-1 md:order-2">
            <div className="dw-float">
              <Phone step={step} sig={sig} />
            </div>
            <p className="mt-5 text-center text-[11px] uppercase tracking-[0.15em] text-[#706b61]">
              Animação ilustrativa, sem dados reais
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
