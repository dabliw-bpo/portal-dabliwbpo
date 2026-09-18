import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dataCurta } from "@/lib/datas";
import { DocumentoDetalhe } from "@/components/portal/documento-detalhe";

export default async function ColaboradorDocumentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      signature: true,
      signatureRejections: { orderBy: { rejectedAt: "desc" }, take: 1, select: { reason: true } },
    },
  });

  if (!document || document.ownerUserId !== session.user.id) {
    notFound();
  }

  return (
    <DocumentoDetalhe
      voltar={{ href: "/portal-colaborador/documentos", rotulo: "Meus documentos" }}
      documento={{ ...document, enviadoEm: dataCurta(document.createdAt) }}
      arquivoUrl={`/api/documentos/${document.id}/arquivo`}
      assinante={session.user.name ?? ""}
      recusaAnterior={document.signature ? null : (document.signatureRejections[0]?.reason ?? null)}
    />
  );
}
