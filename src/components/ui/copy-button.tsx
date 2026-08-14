"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "@phosphor-icons/react/dist/ssr";

type Status = "idle" | "copied" | "failed";

/**
 * Copies a single value to the clipboard. Sits inside the field it belongs to,
 * so there is no doubt about which value was copied.
 */
export function CopyButton({
  value,
  label,
  text,
  className = "",
}: {
  value: string;
  /** Completes "Copiar …" for screen readers, e.g. "os dados da conta". */
  label: string;
  /** Visible caption. Omit for an icon-only button. */
  text?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  // The confirmation is transient; the state resets itself rather than
  // leaving a stale check mark next to a field the user moved on from.
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 1800);
    return () => clearTimeout(timer);
  }, [status]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      // Clipboard access can be refused (insecure context, denied permission).
      setStatus("failed");
    }
  }

  const title =
    status === "copied" ? "Copiado" : status === "failed" ? "Não foi possível copiar" : "Copiar";

  const icon =
    status === "copied" ? (
      <Check size={16} weight="bold" className="text-emerald-600" aria-hidden />
    ) : (
      <Copy size={16} aria-hidden />
    );

  const shell = text
    ? "inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    : "rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700";

  return (
    <button
      type="button"
      onClick={copy}
      title={title}
      aria-label={`Copiar ${label}`}
      className={`${shell} transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-500 ${className}`}
    >
      {icon}
      {text && <span>{status === "copied" ? "Copiado" : text}</span>}
      <span role="status" className="sr-only">
        {status === "copied" ? "Copiado" : status === "failed" ? "Não foi possível copiar" : ""}
      </span>
    </button>
  );
}
