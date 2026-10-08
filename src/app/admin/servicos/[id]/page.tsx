import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ServiceForm } from "../service-form";

export default async function EditarServicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [service, departments] = await Promise.all([
    prisma.service.findUnique({
      where: { id },
      include: {
        checklistTemplate: { orderBy: { order: "asc" } },
        contracts: {
          orderBy: { createdAt: "asc" },
          include: {
            company: { select: { id: true, name: true } },
            bankAccount: { select: { bankName: true, accountNumber: true } },
          },
        },
      },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!service) {
    notFound();
  }

  return (
    <div>
      <Link href="/admin/servicos" className="text-sm text-slate-500 underline hover:text-slate-900">
        ← Voltar para o catálogo
      </Link>
      <h1 className="mt-3 text-lg font-semibold text-slate-900">{service.name}</h1>

      <ServiceForm
        departments={departments}
        serviceId={service.id}
        defaults={{
          name: service.name,
          departmentId: service.departmentId,
          nature: service.nature,
          scope: service.scope,
          estimatedMinutes: service.estimatedMinutes,
          description: service.description,
          active: service.active,
          checklist: service.checklistTemplate.map((item) => ({
            text: item.text,
            required: item.required,
          })),
        }}
      />

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Clientes que contrataram ({service.contracts.length})
        </h2>
        {service.contracts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            Nenhum ainda. A contratação é feita na aba Serviços de cada empresa.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {service.contracts.map((contract) => (
              <li key={contract.id}>
                <Link
                  href={`/admin/empresas/${contract.company.id}/servicos`}
                  className="text-slate-900 underline hover:text-slate-700"
                >
                  {contract.company.name}
                </Link>
                {contract.bankAccount && (
                  <span className="text-slate-500">
                    {" "}
                    · {contract.bankAccount.bankName} cc {contract.bankAccount.accountNumber}
                  </span>
                )}
                {!contract.active && <span className="text-slate-400"> · inativo</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
