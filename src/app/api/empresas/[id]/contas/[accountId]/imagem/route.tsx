import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readPublicAsset } from "@/lib/storage";

const DEFAULT_BRAND = "#0f172a";

/**
 * Escolhe texto claro ou escuro conforme a cor da marca, para a logo do
 * cliente não sumir num contraste ruim.
 */
function readableOn(hex: string): { text: string; soft: string } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return luminance > 0.45
    ? { text: "#0f172a", soft: "rgba(15,23,42,0.65)" }
    : { text: "#ffffff", soft: "rgba(255,255,255,0.72)" };
}

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
  const brand = company.brandColor ?? DEFAULT_BRAND;
  const ink = readableOn(brand);

  // A logo entra embutida: o renderizador não deve depender de buscar a
  // imagem na rede no meio da geração.
  let logoDataUrl: string | null = null;
  if (company.logoPath) {
    try {
      const bytes = await readPublicAsset(company.logoPath);
      const mime = company.logoPath.toLowerCase().endsWith(".png")
        ? "image/png"
        : company.logoPath.toLowerCase().endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      logoDataUrl = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    } catch {
      // Sem logo, o cabeçalho fica só com a razão social.
    }
  }

  const rows: [string, string][] = [
    ["Banco", account.bankCode ? `${account.bankCode} - ${account.bankName}` : account.bankName],
    ["Agência", account.agency],
    ["Conta", account.accountNumber],
  ];
  if (account.cnpj) rows.push(["CNPJ", account.cnpj]);
  if (account.pixKey) rows.push(["PIX", account.pixKey]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            backgroundColor: brand,
            padding: "44px 56px",
          }}
        >
          {logoDataUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 132,
                height: 132,
                borderRadius: 20,
                backgroundColor: "#ffffff",
                padding: 14,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- Satori renderiza <img> direto */}
              <img src={logoDataUrl} width={104} height={104} style={{ objectFit: "contain" }} alt="" />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 22, color: ink.soft, letterSpacing: 2 }}>DADOS BANCÁRIOS</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: ink.text, lineHeight: 1.2 }}>
              {company.name}
            </div>
          </div>
        </div>

        {/* Centrado no espaço restante: com três ou seis linhas a folga fica
            equilibrada, em vez de sobrar um vazio no rodapé. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "40px 56px",
            gap: 28,
          }}
        >
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, color: "#64748b", letterSpacing: 1 }}>
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#0f172a" }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", height: 14, backgroundColor: brand }} />
      </div>
    ),
    { width: 1080, height: 1080 }
  );
}
