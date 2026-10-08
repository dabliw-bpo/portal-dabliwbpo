import Link from "next/link";

/**
 * Liga e desliga a exibição das atividades concluídas na árvore. É um link
 * (`?concluidas=1`) e não estado de cliente: a escolha fica na URL e a página
 * continua sendo renderizada no servidor.
 */
export function AlternaEncerradas({
  ativo,
  total,
  href,
}: {
  ativo: boolean;
  total: number;
  /** Caminho da própria página, sem query. */
  href: string;
}) {
  if (!ativo && total === 0) return null;
  return (
    <Link
      href={ativo ? href : `${href}?concluidas=1`}
      className="text-sm text-slate-500 underline hover:text-slate-900"
    >
      {ativo
        ? "Ocultar concluídas"
        : total === 1
          ? "Mostrar 1 concluída oculta"
          : `Mostrar ${total} concluídas ocultas`}
    </Link>
  );
}
