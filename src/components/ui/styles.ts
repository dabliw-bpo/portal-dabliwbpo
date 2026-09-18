/*
 * Cada estilo tem a forma clara (admin e RH) e, por cima, a do portal — o
 * mesmo desenho dos botões do site institucional: canto reto, caixa alta,
 * dourado. As classes `portal:` só valem dentro de .tema-portal.
 */

export const buttonPrimary =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-60 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 portal:rounded-none portal:bg-ouro portal:px-6 portal:py-3 portal:text-[13px] portal:uppercase portal:tracking-[0.12em] portal:text-breu portal:hover:bg-ouro-claro portal:focus-visible:outline-ouro";

export const buttonSuccess =
  "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 portal:rounded-none portal:bg-ouro portal:px-6 portal:py-3 portal:text-[13px] portal:uppercase portal:tracking-[0.12em] portal:text-breu portal:hover:bg-ouro-claro portal:focus-visible:outline-ouro";

export const buttonSecondary =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 portal:rounded-none portal:border-ouro-escuro portal:bg-transparent portal:px-6 portal:py-3 portal:text-[13px] portal:uppercase portal:tracking-[0.12em] portal:text-ouro portal:hover:bg-ouro/10 portal:focus-visible:outline-ouro";

export const buttonDanger =
  "rounded-md px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 portal:rounded-none portal:text-terracota portal:hover:bg-terracota/10 portal:focus-visible:outline-terracota";

export const buttonGhost =
  "rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 portal:rounded-none portal:text-[13px] portal:uppercase portal:tracking-[0.12em] portal:text-areia portal:hover:bg-transparent portal:hover:text-ouro portal:focus-visible:outline-ouro";

export const inputBase =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-500 portal:rounded-none portal:border-fio-forte portal:bg-cartao portal:px-4 portal:py-3 portal:text-[15px] portal:text-marfim portal:placeholder:text-pedra portal:focus:border-ouro portal:focus-visible:outline-ouro portal:[color-scheme:dark]";

/** An input that doubles as its own read-only display when `disabled`. */
export const inputToggleable = `${inputBase} disabled:cursor-default disabled:border-transparent disabled:bg-slate-50 disabled:text-slate-700 portal:disabled:bg-noite portal:disabled:text-areia`;
