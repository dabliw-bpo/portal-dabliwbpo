"use client";

import { useEffect, useState } from "react";
import { Check, DownloadSimple, Image as ImageIcon } from "@phosphor-icons/react/dist/ssr";
import { buttonSecondary } from "@/components/ui/styles";

type Status = "idle" | "working" | "copied" | "unsupported" | "failed";

/**
 * Copia a imagem dos dados bancários para a área de transferência, com download
 * como saída: nem todo navegador deixa escrever imagem no clipboard, e quando
 * não deixa o usuário ainda precisa do arquivo.
 */
export function BankAccountImageButtons({ imageUrl, fileName }: { imageUrl: string; fileName: string }) {
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (status === "idle" || status === "working") return;
    const timer = setTimeout(() => setStatus("idle"), 2600);
    return () => clearTimeout(timer);
  }, [status]);

  async function copyImage() {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
      setStatus("unsupported");
      return;
    }

    setStatus("working");
    try {
      // O ClipboardItem recebe a promessa do blob: alguns navegadores exigem
      // que a escrita comece no mesmo gesto do clique.
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": fetch(imageUrl).then((response) => {
            if (!response.ok) throw new Error("Falha ao gerar a imagem.");
            return response.blob();
          }),
        }),
      ]);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  const message =
    status === "copied"
      ? "Imagem copiada."
      : status === "unsupported"
        ? "Seu navegador não copia imagem. Use Baixar."
        : status === "failed"
          ? "Não foi possível copiar. Use Baixar."
          : "";

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={copyImage}
          disabled={status === "working"}
          className={`inline-flex items-center gap-1.5 ${buttonSecondary}`}
        >
          {status === "copied" ? (
            <Check size={16} weight="bold" className="text-emerald-600" aria-hidden />
          ) : (
            <ImageIcon size={16} aria-hidden />
          )}
          {status === "working" ? "Gerando..." : status === "copied" ? "Copiado" : "Copiar imagem"}
        </button>

        <a
          href={imageUrl}
          download={fileName}
          className={`inline-flex items-center gap-1.5 ${buttonSecondary}`}
        >
          <DownloadSimple size={16} aria-hidden />
          Baixar
        </a>
      </div>

      <p role="status" className={message ? "text-xs text-slate-500" : "sr-only"}>
        {message}
      </p>
    </div>
  );
}
