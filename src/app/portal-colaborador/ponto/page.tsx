import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loadTimeClockView } from "@/lib/time-clock-view";
import { PontoEnvios } from "@/components/ponto/ponto-envios";
import { PontoUpload } from "@/components/ponto/ponto-upload";
import { Sobrelinha } from "@/components/portal/sobrelinha";

/**
 * O colaborador manda a foto ou o arquivo do ponto do mês e acompanha o que já
 * enviou, mês a mês. O que ele envia aparece para o BPO na aba Controle de
 * ponto do cadastro dele.
 */
export default async function PortalColaboradorPontoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { arquivos, meses, opcoes, mesAtual } = await loadTimeClockView({
    collaboratorUserId: session.user.id,
    viewer: { id: session.user.id, role: session.user.role },
  });

  // O lembrete mensal leva ?mes=AAAA-MM: o formulário já abre no mês citado.
  const pedido = (await searchParams).mes;
  const mesPedido = Array.isArray(pedido) ? pedido[0] : pedido;
  const mesPadrao = opcoes.some((opcao) => opcao.chave === mesPedido) ? mesPedido! : mesAtual;

  return (
    <div>
      <Sobrelinha>Fotos e arquivos do seu ponto</Sobrelinha>
      <h1 className="mt-5 font-serifa text-5xl font-medium leading-none text-marfim sm:text-6xl">
        Controle de ponto
      </h1>

      <div className="mt-10">
        <PontoUpload meses={opcoes} mesPadrao={mesPadrao} />
      </div>

      <PontoEnvios arquivos={arquivos} meses={meses} />
    </div>
  );
}
