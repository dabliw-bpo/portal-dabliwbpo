import Link from "next/link";
import { prisma } from "@/lib/prisma";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  COLLABORATOR: "Colaborador",
  CLIENT: "Cliente",
};

export default async function AdminUsuariosPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">Usuários</h1>
        <Link
          href="/admin/usuarios/novo"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Novo usuário
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Nome</th>
              <th scope="col" className="px-4 py-2 font-medium">Email</th>
              <th scope="col" className="px-4 py-2 font-medium">Papel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-2 text-slate-900">{user.name}</td>
                <td className="px-4 py-2 text-slate-600">{user.email}</td>
                <td className="px-4 py-2 text-slate-600">{ROLE_LABELS[user.role]}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-600">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
