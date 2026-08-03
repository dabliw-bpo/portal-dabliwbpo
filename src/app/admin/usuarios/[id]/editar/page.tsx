import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditarUsuarioForm } from "./editar-usuario-form";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, companies] = await Promise.all([
    prisma.user.findUnique({ where: { id } }),
    prisma.company.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Editar usuário</h1>
      <EditarUsuarioForm
        userId={user.id}
        companies={companies}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          companyId: user.companyId,
        }}
      />
    </div>
  );
}
