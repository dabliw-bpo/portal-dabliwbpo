import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { TIME_CLOCK_MIME_TYPES } from "@/lib/time-clock";

/**
 * Abre um arquivo de ponto. Quem pode: o admin, o próprio colaborador e o RH
 * da empresa dele. Sem sessão ou sem vínculo, a resposta é a mesma de um
 * arquivo que não existe, para o endereço não servir de sonda.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.timeClockFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const { role, id: userId, companyId } = session.user;
  const allowed =
    role === "ADMIN" ||
    file.collaboratorUserId === userId ||
    (role === "COMPANY_HR" && companyId !== null && companyId === file.companyId);
  if (!allowed) {
    return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  // O tipo servido é o que foi conferido no envio; qualquer valor fora da
  // lista cai em download genérico em vez de ser interpretado pelo navegador.
  const known = (TIME_CLOCK_MIME_TYPES as readonly string[]).includes(file.mimeType);
  const buffer = await readStoredFile(file.filePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": known ? file.mimeType : "application/octet-stream",
      "Content-Disposition": `${known ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
