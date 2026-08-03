import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditarUsuarioForm } from "./editar-usuario-form";

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Editar usuário</h1>
      <EditarUsuarioForm
        userId={user.id}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
        }}
      />
    </div>
  );
}
