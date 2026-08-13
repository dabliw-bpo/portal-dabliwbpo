import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { isInternalRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { taskScopeFor } from "@/lib/tasks/scope";

/** A atividade está no recorte de leitura deste usuário interno? */
async function canReadTaskDocument(session: Session, taskId: string): Promise<boolean> {
  if (!isInternalRole(session.user.role)) {
    return false;
  }
  const scope = await taskScopeFor(session);
  const found = await prisma.task.findFirst({
    where: { AND: [{ id: taskId }, scope] },
    select: { id: true },
  });
  return found !== null;
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

  // O relatório de auditoria é servido pela mesma rota, sob a mesma permissão
  // do documento a que pertence.
  const wantsAudit = new URL(request.url).searchParams.get("tipo") === "auditoria";
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

  const buffer = await readStoredFile(document.filePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(document.fileName)}"`,
      "Content-Length": String(document.fileSize),
      "Cache-Control": "private, no-store",
    },
  });
}
