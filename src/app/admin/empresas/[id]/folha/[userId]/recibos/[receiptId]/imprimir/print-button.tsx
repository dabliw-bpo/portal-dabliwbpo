"use client";

import { buttonPrimary } from "@/components/ui/styles";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={`print:hidden ${buttonPrimary}`}>
      Imprimir
    </button>
  );
}
