import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NovoDepartamentoForm } from "./novo-departamento-form";

export default async function AdminDepartamentosPage() {
  const departments = await prisma.department.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { services: true, members: true } },
      members: { where: { manager: true }, include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Departamentos</h1>
        <Link href="/admin/servicos" className="text-sm text-slate-600 underline hover:text-slate-900">
          Catálogo de serviços
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Um gestor só enxerga os departamentos que gerencia; um operador, os que participa.
      </p>

      <NovoDepartamentoForm />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Departamento</th>
              <th scope="col" className="px-4 py-2 font-medium">Gestores</th>
              <th scope="col" className="px-4 py-2 font-medium">Equipe</th>
              <th scope="col" className="px-4 py-2 font-medium">Serviços</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {departments.map((department) => (
              <tr key={department.id} className={department.active ? undefined : "opacity-60"}>
                <td className="px-4 py-2 text-slate-900">
                  <span className="flex items-center gap-2">
                    {department.color && (
                      <span
                        aria-hidden
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: department.color }}
                      />
                    )}
                    <Link
                      href={`/admin/departamentos/${department.id}`}
                      className="underline hover:text-slate-700"
                    >
                      {department.name}
                    </Link>
                    {!department.active && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        Inativo
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-600">
                  {department.members.length === 0
                    ? "—"
                    : department.members.map((m) => m.user.name).join(", ")}
                </td>
                <td className="px-4 py-2 text-slate-600">{department._count.members} pessoa(s)</td>
                <td className="px-4 py-2 text-slate-600">{department._count.services}</td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-600">
                  Nenhum departamento ainda. Crie o primeiro acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
