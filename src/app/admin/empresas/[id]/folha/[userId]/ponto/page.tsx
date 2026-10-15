import { auth } from "@/lib/auth";
import { loadTimeClockView } from "@/lib/time-clock-view";
import { PontoEnvios } from "@/components/ponto/ponto-envios";
import { PontoUpload } from "@/components/ponto/ponto-upload";
import { CollaboratorHeader, CollaboratorTabs, loadCollaborator } from "../collaborator-tabs";

export default async function ColaboradorPontoPage({
  params,
}: {
  params: Promise<{ id: string; userId: string }>;
}) {
  const { id, userId } = await params;
  const session = await auth();
  const { company, user } = await loadCollaborator(id, userId);

  const { arquivos, meses, opcoes, mesAtual } = await loadTimeClockView({
    collaboratorUserId: userId,
    viewer: { id: session?.user?.id ?? "", role: session?.user?.role ?? "" },
  });

  const mesesComEnvio = new Set(arquivos.map((arquivo) => arquivo.mes));
  const semEnvio = meses.filter((mes) => !mesesComEnvio.has(mes.chave)).length;

  return (
    <div>
      <CollaboratorHeader companyId={id} companyName={company.name} userName={user.name} />
      <CollaboratorTabs companyId={id} userId={userId} active="ponto" />

      <p className="mt-4 text-sm text-slate-600">
        {arquivos.length === 1 ? "1 arquivo enviado" : `${arquivos.length} arquivos enviados`}
        {semEnvio > 0 && (
          <>
            {" · "}
            <span className="font-medium text-amber-800">
              {semEnvio === 1 ? "1 mês sem envio" : `${semEnvio} meses sem envio`}
            </span>
          </>
        )}
      </p>

      <div className="mt-4">
        <PontoUpload meses={opcoes} mesPadrao={mesAtual} collaboratorUserId={userId} />
      </div>

      <PontoEnvios arquivos={arquivos} meses={meses} />
    </div>
  );
}
