import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";
import { getAvatarUrl } from "@/lib/avatar";
import { UsuariosTable } from "@/components/users/usuarios-table";

export default async function PortalRhColaboradoresPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.companyId) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Colaboradores</h1>
        <p className="mt-4 text-sm text-slate-600">
          Sua conta ainda não está vinculada a uma empresa. Fale com o administrador.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    where: { companyId: session.user.companyId, role: "COLLABORATOR" },
    orderBy: { createdAt: "desc" },
    include: { company: true },
  });

  const rows = users.map((user) => ({
    ...user,
    avatarUrl: getAvatarUrl(user.avatarPath),
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Colaboradores</h1>
        <Link href="/portal-rh/colaboradores/novo" className={buttonPrimary}>
          Novo colaborador
        </Link>
      </div>

      <UsuariosTable
        users={rows}
        currentUserId={session.user.id}
        basePath="/portal-rh/colaboradores"
        showCompanyColumn={false}
      />
    </div>
  );
}
