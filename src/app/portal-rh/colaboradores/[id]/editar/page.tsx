import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditarColaboradorForm } from "./editar-colaborador-form";

export default async function EditarColaboradorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user || user.role !== "COLLABORATOR" || user.companyId !== session.user.companyId) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Editar colaborador</h1>
      <EditarColaboradorForm
        userId={user.id}
        defaultValues={{ name: user.name, email: user.email, active: user.active }}
      />
    </div>
  );
}
