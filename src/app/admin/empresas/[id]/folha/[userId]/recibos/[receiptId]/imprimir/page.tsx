import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCompanyLogoUrl } from "@/lib/avatar";
import { APP_TIME_ZONE, formatCents } from "@/lib/format";
import { loadCollaborator } from "../../../collaborator-tabs";
import { PrintButton } from "./print-button";

function SignatureLine({
  image,
  name,
  detail,
}: {
  image: string | null;
  name: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-20 items-end justify-center">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- data URL inline
          <img src={image} alt={`Assinatura de ${name}`} className="max-h-20 object-contain" />
        )}
      </div>
      <div className="w-full border-t border-slate-900 pt-2 text-center">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

export default async function ImprimirReciboPage({
  params,
}: {
  params: Promise<{ id: string; userId: string; receiptId: string }>;
}) {
  const { id, userId, receiptId } = await params;
  const { company, user } = await loadCollaborator(id, userId);

  const receipt = await prisma.paymentReceipt.findFirst({
    where: { id: receiptId, companyId: id, collaboratorUserId: userId },
  });

  if (!receipt) {
    notFound();
  }

  const logoUrl = getCompanyLogoUrl(company.logoPath);
  const issued = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(receipt.issuedAt);

  const place = company.city ? `${company.city}${company.state ? `/${company.state}` : ""}` : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <article className="rounded-lg border border-slate-200 bg-white p-10 print:rounded-none print:border-0 print:p-0">
        <header className="flex items-start justify-between gap-6 border-b border-slate-300 pb-5">
          <div className="flex items-center gap-4">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase public bucket
              <img
                src={logoUrl}
                alt={company.name}
                className="h-14 max-w-[130px] object-contain object-left"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{company.name}</p>
              {company.cnpj && <p className="text-xs text-slate-600">CNPJ {company.cnpj}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-500">Recibo de pagamento</p>
            <p className="text-2xl font-semibold tabular-nums text-slate-900">
              {formatCents(receipt.amountCents)}
            </p>
          </div>
        </header>

        <p className="mt-8 text-[15px] leading-8 text-slate-900">
          Recebi de <strong>{company.name}</strong>
          {company.cnpj && <>, inscrita no CNPJ sob o nº {company.cnpj}</>}, a importância de{" "}
          <strong>{formatCents(receipt.amountCents)}</strong>, referente a{" "}
          <strong>{receipt.description}</strong>, dando plena e geral quitação pelo valor recebido.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 border-y border-slate-200 py-5 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">Recebedor</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-500">CPF</dt>
            <dd className="mt-0.5 font-medium tabular-nums text-slate-900">
              {user.cpf ?? "Não informado"}
            </dd>
          </div>
        </dl>

        <p className="mt-8 text-sm text-slate-700">
          {place ? `${place}, ` : ""}
          {issued}.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-12">
          <SignatureLine
            image={receipt.companySignatureImage}
            name={company.name}
            detail="Empresa pagadora"
          />
          <SignatureLine
            image={receipt.collaboratorSignatureImage}
            name={user.name}
            detail={user.cpf ? `CPF ${user.cpf}` : "Recebedor"}
          />
        </div>
      </article>
    </div>
  );
}
