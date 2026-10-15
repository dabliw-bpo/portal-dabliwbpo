import { prisma } from "@/lib/prisma";
import { APP_TIME_ZONE } from "@/lib/format";
import {
  currentMonthKey,
  formatBytes,
  monthName,
  monthsDescending,
  splitMonthKey,
} from "@/lib/time-clock";
import type { PontoArquivo, PontoMes } from "@/components/ponto/ponto-envios";
import type { MesOpcao } from "@/components/ponto/ponto-upload";

function monthKeyOfDate(date: Date): string {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return key.slice(0, 7);
}

/**
 * Dados para as telas de controle de ponto (portal do colaborador e aba do
 * admin): os arquivos do colaborador e a lista de meses a exibir.
 *
 * A lista de meses vai de janeiro do ano corrente — ou do primeiro envio, se
 * for anterior — até o mês atual, sem passar da admissão do colaborador. Meses
 * sem arquivo continuam na lista, porque "não enviou" é justamente o que o
 * controle precisa mostrar.
 */
export async function loadTimeClockView({
  collaboratorUserId,
  viewer,
}: {
  collaboratorUserId: string;
  viewer: { id: string; role: string };
}) {
  const [files, collaborator] = await Promise.all([
    prisma.timeClockFile.findMany({
      where: { collaboratorUserId },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { name: true } } },
    }),
    prisma.user.findUnique({
      where: { id: collaboratorUserId },
      select: { admissionDate: true },
    }),
  ]);

  const stamp = new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

  const arquivos: PontoArquivo[] = files.map((file) => ({
    id: file.id,
    mes: file.referenceMonth,
    nome: file.fileName,
    tamanho: formatBytes(file.fileSize),
    enviadoEm: stamp.format(file.createdAt),
    enviadoPor: file.uploadedBy.name,
    ehPdf: file.mimeType === "application/pdf",
    podeExcluir:
      viewer.role === "ADMIN" ||
      (viewer.role === "COLLABORATOR" && file.uploadedByUserId === viewer.id),
  }));

  const atual = currentMonthKey();
  const janeiro = `${atual.slice(0, 4)}-01`;
  const primeiroEnvio = files.map((file) => file.referenceMonth).sort()[0] ?? null;
  let inicio = janeiro;
  if (primeiroEnvio && primeiroEnvio < inicio) inicio = primeiroEnvio;
  const admissao = collaborator?.admissionDate ? monthKeyOfDate(collaborator.admissionDate) : null;
  if (admissao && admissao > inicio && (!primeiroEnvio || primeiroEnvio >= admissao)) {
    inicio = admissao > atual ? atual : admissao;
  }

  const meses: PontoMes[] = monthsDescending(inicio, atual).map((chave) => {
    const { year, month } = splitMonthKey(chave);
    return { chave, ano: year, numero: month, rotulo: `${monthName(month)} de ${year}` };
  });

  // Para enviar: o mês atual e os 11 anteriores, independentemente da admissão.
  const opcoes: MesOpcao[] = monthsDescending(
    (() => {
      const { year, month } = splitMonthKey(atual);
      const total = year * 12 + (month - 1) - 11;
      return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
    })(),
    atual
  ).map((chave) => {
    const { year, month } = splitMonthKey(chave);
    return { chave, rotulo: `${monthName(month)} de ${year}` };
  });

  return { arquivos, meses, opcoes, mesAtual: atual };
}
