import { auth } from "@/lib/auth";
import { bankCardImage, bankCardRows, type BankCardData } from "@/lib/bank-card-art";
import { prisma } from "@/lib/prisma";
import { readPublicAsset } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; accountId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id, accountId } = await params;

  const isAdmin = session.user.role === "ADMIN";
  const isSameCompanyHr = session.user.role === "COMPANY_HR" && session.user.companyId === id;
  if (!isAdmin && !isSameCompanyHr) {
    return Response.json({ error: "Sem permissão." }, { status: 403 });
  }

  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, companyId: id },
    include: { company: true },
  });
  if (!account) {
    return Response.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  const company = account.company;

  // A logo entra embutida: o render não deve depender de buscar a imagem na
  // rede no meio da geração.
  let logo: BankCardData["logo"] = null;
  if (company.logoPath) {
    try {
      const lower = company.logoPath.toLowerCase();
      logo = {
        bytes: await readPublicAsset(company.logoPath),
        mime: lower.endsWith(".png")
          ? "image/png"
          : lower.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg",
      };
    } catch {
      // Sem logo, o cabeçalho fica só com a razão social.
    }
  }

  return bankCardImage({
    companyName: company.name,
    brandColor: company.brandColor,
    cardStyle: company.cardStyle,
    logo,
    rows: bankCardRows(account),
  });
}
