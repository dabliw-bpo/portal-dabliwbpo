import Link from "next/link";
import { notFound } from "next/navigation";
import { INTERNAL_ROLES } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { DepartamentoForm, EquipeForm, type MemberRow } from "./departamento-forms";

export default async function EditarDepartamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [department, internalUsers] = await Promise.all([
    prisma.department.findUnique({
      where: { id },
      include: {
        members: true,
        services: { orderBy: { name: "asc" }, select: { id: true, name: true, active: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: [...INTERNAL_ROLES] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  if (!department) {
    notFound();
  }

  const membershipById = new Map(department.members.map((m) => [m.userId, m.manager]));
  const users: MemberRow[] = internalUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    membership: membershipById.has(user.id)
      ? membershipById.get(user.id)
        ? "manager"
        : "member"
      : "none",
  }));

  return (
    <div>
      <Link
        href="/admin/departamentos"
        className="text-sm text-slate-500 underline hover:text-slate-900"
      >
        ← Voltar para departamentos
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">{department.name}</h1>

      <DepartamentoForm
        departmentId={department.id}
        defaults={{
          name: department.name,
          color: department.color,
          active: department.active,
        }}
      />

      <EquipeForm departmentId={department.id} users={users} />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Serviços deste departamento ({department.services.length})
        </h2>
        {department.services.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Nenhum serviço ainda.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {department.services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/admin/servicos/${service.id}`}
                  className="text-slate-900 underline hover:text-slate-700"
                >
                  {service.name}
                </Link>
                {!service.active && <span className="text-slate-400"> · inativo</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
