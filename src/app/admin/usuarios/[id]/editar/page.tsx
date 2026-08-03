import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditarUsuarioForm } from "./editar-usuario-form";

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id } = await params;
  const { returnTo } = await searchParams;
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
        redirectTo={returnTo && returnTo.startsWith("/admin/") ? returnTo : undefined}
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          companyId: user.companyId,
          whatsapp: user.whatsapp,
        }}
      />
    </div>
  );
}
