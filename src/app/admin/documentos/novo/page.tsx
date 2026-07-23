import { prisma } from "@/lib/prisma";
import { NovoDocumentoForm } from "./novo-documento-form";

export default async function NovoDocumentoPage() {
  const owners = await prisma.user.findMany({
    where: { role: { in: ["CLIENT", "COLLABORATOR"] } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Novo documento</h1>
      <NovoDocumentoForm owners={owners} />
    </div>
  );
}
