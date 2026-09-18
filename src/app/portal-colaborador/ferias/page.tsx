import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVacationPeriod } from "@/lib/format";
import { dataCurta } from "@/lib/datas";
import { buttonPrimary } from "@/components/ui/styles";
import { FeriasLista } from "@/components/portal/ferias-lista";
import { Sobrelinha } from "@/components/portal/sobrelinha";

export default async function PortalColaboradorFeriasPage() {
  const session = await auth();
  const requests = await prisma.vacationRequest.findMany({
    where: { collaboratorUserId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Sobrelinha>Solicitações e acordos</Sobrelinha>
          <h1 className="mt-5 font-serifa text-5xl font-medium leading-none text-marfim sm:text-6xl">
            Minhas férias
          </h1>
        </div>
        <Link href="/portal-colaborador/ferias/nova" className={buttonPrimary}>
          Solicitar férias
        </Link>
      </div>

      <FeriasLista
        itens={requests.map((req) => ({
          id: req.id,
          periodo: formatVacationPeriod(req),
          solicitadoEm: dataCurta(req.createdAt),
          status: req.status,
          documentId: req.documentId,
        }))}
      />
    </div>
  );
}
