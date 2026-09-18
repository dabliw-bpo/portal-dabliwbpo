import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataCurta, hojePorExtenso } from "@/lib/datas";
import { InicioColaborador } from "@/components/portal/inicio-colaborador";

/**
 * Porta de entrada do colaborador. Assinar documentos é a única coisa que o
 * portal pede dele, então os pendentes aparecem logo abaixo do cumprimento,
 * cada um com o link direto para assinar.
 */
export default async function PortalColaboradorPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const pendentes = await prisma.document.findMany({
    where: { ownerUserId: session.user.id, status: "PENDING_SIGNATURE" },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, createdAt: true },
  });

  return (
    <InicioColaborador
      primeiroNome={session.user.name?.trim().split(/\s+/)[0] ?? ""}
      hoje={hojePorExtenso()}
      pendentes={pendentes.map((doc) => ({
        id: doc.id,
        titulo: doc.title,
        enviadoEm: dataCurta(doc.createdAt),
      }))}
    />
  );
}
