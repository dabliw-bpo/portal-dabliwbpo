import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../service-form";

export default async function NovoServicoPage() {
  const departments = await prisma.department.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div>
      <Link href="/admin/servicos" className="text-sm text-slate-500 underline hover:text-slate-900">
        ← Voltar para o catálogo
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">Novo serviço</h1>

      {departments.length === 0 ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Nenhum departamento ativo. Um serviço precisa pertencer a um —{" "}
          <Link href="/admin/departamentos" className="underline">
            crie o primeiro departamento
          </Link>
          .
        </p>
      ) : (
        <ServiceForm departments={departments} />
      )}
    </div>
  );
}
