import Link from "next/link";
import type { Document } from "@prisma/client";
import { Archive, ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { FolhaPendente } from "@/components/portal/folha-pendente";
import { Sobrelinha } from "@/components/portal/sobrelinha";
import { dataCurta } from "@/lib/datas";

type DocumentoDaLista = Document & { signature: { signedAt: Date } | null };

/**
 * A lista dos portais do colaborador e do cliente: o que espera assinatura vem
 * primeiro, como folhas sobre a mesa; o que já foi resolvido vira histórico.
 */
export function DocumentList({
  documents,
  basePath,
}: {
  documents: DocumentoDaLista[];
  basePath: string;
}) {
  if (documents.length === 0) {
    return (
      <div className="mt-10 border border-fio bg-cartao p-8">
        <p className="font-serifa text-2xl text-marfim">Nenhum documento por aqui ainda.</p>
        <p className="mt-2 text-sm text-areia">
          Quando chegar um holerite, recibo ou contrato, ele aparece nesta página e você recebe um
          aviso por e-mail.
        </p>
      </div>
    );
  }

  const pendentes = documents.filter((doc) => doc.status === "PENDING_SIGNATURE");
  const historico = documents.filter((doc) => doc.status !== "PENDING_SIGNATURE");

  return (
    <div className="mt-10 flex flex-col gap-14">
      {pendentes.length > 0 && (
        <section aria-labelledby="lista-pendentes">
          <Sobrelinha id="lista-pendentes">Aguardando a sua assinatura · {pendentes.length}</Sobrelinha>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {pendentes.map((doc) => (
              <FolhaPendente
                key={doc.id}
                href={`${basePath}/${doc.id}`}
                titulo={doc.title}
                enviadoEm={dataCurta(doc.createdAt)}
              />
            ))}
          </div>
        </section>
      )}

      {historico.length > 0 && (
        <section aria-labelledby="lista-historico">
          <Sobrelinha id="lista-historico">Histórico</Sobrelinha>
          <ul className="mt-6 divide-y divide-fio border-y border-fio">
            {historico.map((doc) => {
              const assinado = doc.status === "SIGNED";
              const Icone = assinado ? CheckCircle : Archive;
              return (
                <li key={doc.id}>
                  <Link
                    href={`${basePath}/${doc.id}`}
                    className="group flex items-center gap-4 px-3 py-4 transition-colors hover:bg-cartao focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ouro"
                  >
                    <Icone
                      size={22}
                      weight="light"
                      aria-hidden
                      className={`shrink-0 ${assinado ? "text-salvia" : "text-areia"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-marfim">{doc.title}</span>
                      <span className="mt-0.5 block text-xs text-areia">
                        {assinado && doc.signature
                          ? `Assinado em ${dataCurta(doc.signature.signedAt)}`
                          : `Enviado em ${dataCurta(doc.createdAt)}`}
                      </span>
                    </span>
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="shrink-0 text-pedra transition-[transform,color] group-hover:translate-x-1 group-hover:text-ouro motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
