import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentList } from "@/components/documents/document-list";
import { Sobrelinha } from "@/components/portal/sobrelinha";

export default async function PortalColaboradorDocumentosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const documents = await prisma.document.findMany({
    where: { ownerUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { signature: { select: { signedAt: true } } },
  });

  return (
    <div>
      <Sobrelinha>Holerites, recibos e contratos</Sobrelinha>
      <h1 className="mt-5 font-serifa text-5xl font-medium leading-none text-marfim sm:text-6xl">
        Meus documentos
      </h1>
      <DocumentList documents={documents} basePath="/portal-colaborador/documentos" />
    </div>
  );
}
