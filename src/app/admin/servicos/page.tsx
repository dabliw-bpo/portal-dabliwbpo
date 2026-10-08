import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buttonPrimary } from "@/components/ui/styles";
import { GerarAtividadesPanel } from "./gerar-atividades-panel";

const SCOPE_LABELS: Record<string, string> = {
  EMPRESA: "Por cliente",
  CONTA_BANCARIA: "Por conta bancária",
  COLABORADOR: "Por colaborador",
};

const NATURE_LABELS: Record<string, string> = {
  RECORRENTE: "Recorrente",
  SOB_DEMANDA: "Sob demanda",
};

export default async function AdminServicosPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      department: { select: { name: true } },
      _count: { select: { checklistTemplate: true, contracts: true } },
    },
  });

  const lastRun = await prisma.generationRun.findFirst({ orderBy: { startedAt: "desc" } });

  return (
    <div>
      <Link href="/admin/empresas" className="text-sm text-slate-500 underline hover:text-slate-900">
        ← Empresas
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-slate-900">Catálogo de serviços</h1>
        <div className="flex gap-2">
          <Link href="/admin/departamentos" className="self-center text-sm text-slate-600 underline hover:text-slate-900">
            Departamentos
          </Link>
          <Link href="/admin/servicos/novo" className={buttonPrimary}>
            Novo serviço
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        O que o BPO sabe fazer. A contratação e as demandas de cada cliente ficam na aba Gestão
        de Tarefas da empresa.
      </p>

      <GerarAtividadesPanel lastRun={lastRun} />

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Serviço</th>
              <th scope="col" className="px-4 py-2 font-medium">Departamento</th>
              <th scope="col" className="px-4 py-2 font-medium">Natureza</th>
              <th scope="col" className="px-4 py-2 font-medium">Granularidade</th>
              <th scope="col" className="px-4 py-2 font-medium">Checklist</th>
              <th scope="col" className="px-4 py-2 font-medium">Contratos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {services.map((service) => (
              <tr key={service.id} className={service.active ? undefined : "opacity-60"}>
                <td className="px-4 py-2 text-slate-900">
                  <Link
                    href={`/admin/servicos/${service.id}`}
                    className="underline hover:text-slate-700"
                  >
                    {service.name}
                  </Link>
                  {!service.active && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-600">{service.department.name}</td>
                <td className="px-4 py-2 text-slate-600">{NATURE_LABELS[service.nature]}</td>
                <td className="px-4 py-2 text-slate-600">{SCOPE_LABELS[service.scope]}</td>
                <td className="px-4 py-2 text-slate-600">
                  {service._count.checklistTemplate} etapa(s)
                </td>
                <td className="px-4 py-2 text-slate-600">{service._count.contracts}</td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-600">
                  Nenhum serviço cadastrado. Crie o primeiro para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
