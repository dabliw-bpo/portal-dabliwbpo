import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";
import { UsuariosTable } from "./usuarios-table";

export default async function AdminUsuariosPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Usuários</h1>
        <Link href="/admin/usuarios/novo" className={buttonPrimary}>
          Novo usuário
        </Link>
      </div>

      <UsuariosTable users={users} currentUserId={session.user.id} />
    </div>
  );
}
