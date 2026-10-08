import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { AuthzError } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { taskScopeFor } from "@/lib/tasks/scope";

/**
 * A atividade está no recorte de leitura deste usuário? Quem não tem recorte
 * algum (cliente, RH, colaborador fora da Matriz...) simplesmente não lê.
 */
async function canReadTaskDocument(session: Session, taskId: string): Promise<boolean> {
  try {
    const scope = await taskScopeFor(session);
    const found = await prisma.task.findFirst({
      where: { AND: [{ id: taskId }, scope] },
      select: { id: true },
    });
    return found !== null;
  } catch (error) {
    if (error instanceof AuthzError) {
      return false;
    }
    throw error;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id }, include: { owner: true } });
  if (!document) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const isOwner = document.ownerUserId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  const isSameCompanyHr =
    session.user.role === "COMPANY_HR" &&
    session.user.companyId !== null &&
    document.owner.companyId === session.user.companyId;

  // Evidência de entrega de atividade não pertence a quem a subiu, e sim à
  // atividade: quem enxerga a atividade precisa conseguir abrir o anexo, senão
  // o gestor não consegue conferir o que o operador entregou.
  const isTaskEvidenceInScope = document.taskId
    ? await canReadTaskDocument(session, document.taskId)
    : false;

  if (!isOwner && !isAdmin && !isSameCompanyHr && !isTaskEvidenceInScope) {
    return NextResponse.json({ error: "Sem permissão para acessar este documento." }, { status: 403 });
  }

  // A selfie é dado pessoal sensível: só o admin abre a imagem, mesmo que o
  // dono do documento e o RH da empresa possam abrir o documento em si. (O
  // relatório de auditoria, abaixo, leva a foto e segue a permissão do documento.)
  const query = new URL(request.url).searchParams;
  if (query.get("tipo") === "selfie") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Sem permissão para ver a selfie." }, { status: 403 });
    }
    const recusaId = query.get("recusa");
    const holder = recusaId
      ? await prisma.signatureRejection.findFirst({
          where: { id: recusaId, documentId: document.id },
          select: { selfiePath: true },
        })
      : await prisma.signature.findUnique({
          where: { documentId: document.id },
          select: { selfiePath: true },
        });
    if (!holder?.selfiePath) {
      return NextResponse.json({ error: "Selfie não disponível." }, { status: 404 });
    }
    const photo = await readStoredFile(holder.selfiePath);
    return new NextResponse(new Uint8Array(photo), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(photo.byteLength),
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // O relatório de auditoria é servido pela mesma rota, sob a mesma permissão
  // do documento a que pertence.
  const wantsAudit = query.get("tipo") === "auditoria";
  if (wantsAudit) {
    if (!document.auditFilePath) {
      return NextResponse.json({ error: "Relatório não disponível." }, { status: 404 });
    }
    const report = await readStoredFile(document.auditFilePath);
    return new NextResponse(new Uint8Array(report), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="auditoria-${document.id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // Depois de assinado, o que se abre é a via com a rubrica no corpo do
  // documento. O original continua servido por `?tipo=original`, porque é dele
  // que sai o hash registrado na auditoria — quem confere a prova precisa
  // conseguir chegar no arquivo exato que foi assinado.
  const wantsOriginal = query.get("tipo") === "original";
  const path = !wantsOriginal && document.signedFilePath ? document.signedFilePath : document.filePath;
  const buffer = await readStoredFile(path);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
      // O tamanho vem do que foi lido, não do cadastro: a via assinada tem a
      // rubrica desenhada dentro e não bate com o fileSize do original.
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
    },
  });
}
