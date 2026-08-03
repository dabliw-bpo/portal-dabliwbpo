import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NovoDocumentoForm } from "@/components/documents/novo-documento-form";

export default async function PortalRhNovoDocumentoPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const owners = session.user.companyId
    ? await prisma.user.findMany({
        where: { role: "COLLABORATOR", companyId: session.user.companyId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      })
    : [];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Novo documento</h1>
      <NovoDocumentoForm owners={owners} />
    </div>
  );
}
