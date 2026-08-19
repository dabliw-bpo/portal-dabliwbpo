import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { imageSize } from "@/lib/image-size";
import { CARD_STYLES, type CardStyle } from "@/lib/validations/company";

export const DEFAULT_BRAND = "#0f172a";

/** Família só do peso 700: o renderizador já traz a Geist regular embutida. */
const BOLD_FAMILY = "Geist Bold";

let boldFont: Promise<Buffer | null> | null = null;

function loadBoldFont(): Promise<Buffer | null> {
  boldFont ??= readFile(path.join(process.cwd(), "src/assets/fonts/Geist-Bold.ttf")).catch(
    () => null // Sem a fonte, o texto sai no peso normal em vez de quebrar a imagem.
  );
  return boldFont;
}

/** O CNPJ é gravado como foi digitado; na arte ele sai sempre pontuado. */
function formatCnpj(value: string): string {
  const digits = value.replace(/D/g, "");
  if (digits.length !== 14) return value;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export type BankAccountLike = {
  bankName: string;
  bankCode: string | null;
  agency: string;
  accountNumber: string;
  cnpj: string | null;
  pixKey: string | null;
};

/** As linhas da arte, na ordem em que se lê uma transferência. */
export function bankCardRows(account: BankAccountLike): [string, string][] {
  const rows: [string, string][] = [
    ["Banco", account.bankCode ? `${account.bankCode} - ${account.bankName}` : account.bankName],
    ["Agência", account.agency],
    ["Conta", account.accountNumber],
  ];
  if (account.cnpj) rows.push(["CNPJ", formatCnpj(account.cnpj)]);
  // A chave PIX vai como foi cadastrada, exceto quando é o próprio CNPJ
  // solto — aí pontuar só facilita a leitura.
  if (account.pixKey) rows.push(["PIX", formatCnpj(account.pixKey)]);
  return rows;
}

export type BankCardData = {
  companyName: string;
  brandColor: string | null;
  cardStyle: string | null;
  /** Logo já embutida como data URI, para o render não depender da rede. */
  logo: { bytes: Uint8Array; mime: string } | null;
  rows: [string, string][];
};

/**
 * Escolhe texto claro ou escuro conforme a cor da marca, para o texto não
 * sumir num contraste ruim.
 */
function readableOn(hex: string): { text: string; soft: string } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

  return luminance > 0.45
    ? { text: "#0f172a", soft: "rgba(15,23,42,0.65)" }
    : { text: "#ffffff", soft: "rgba(255,255,255,0.72)" };
}

type LogoArt = { src: string; ratio: number };

/**
 * A caixa da logo acompanha a proporção do arquivo: as logos das empresas vão
 * de quadradas a faixas bem largas, e forçar todas num quadrado deixa a marca
 * minúscula no meio de um vazio.
 */
function Logo({ logo, height, width }: { logo: LogoArt; height?: number; width?: number }) {
  const padding = 10;
  // Limita os extremos para uma logo muito larga não empurrar a razão social
  // para fora nem uma muito alta virar um risco vertical.
  const ratio = Math.min(Math.max(logo.ratio, 0.75), 3.2);

  // Dá para fixar a altura (cabeçalhos em linha) ou a largura (coluna
  // lateral, onde a marca deve ocupar a faixa inteira).
  const inner =
    width !== undefined
      ? { w: width - padding * 2, h: Math.round((width - padding * 2) / ratio) }
      : { w: Math.round((height! - padding * 2) * ratio), h: height! - padding * 2 };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: inner.w + padding * 2,
        height: inner.h + padding * 2,
        borderRadius: 18,
        backgroundColor: "#ffffff",
        padding,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- Satori renderiza <img> direto */}
      <img src={logo.src} width={inner.w} height={inner.h} style={{ objectFit: "contain" }} alt="" />
    </div>
  );
}

/** Nomes de banco longos estouram a linha; encolhe em vez de quebrar em duas. */
function fitValue(value: string, size: number): number {
  if (value.length > 44) return size - 12;
  if (value.length > 34) return size - 8;
  if (value.length > 27) return size - 4;
  return size;
}

function Rows({
  rows,
  labelColor,
  valueColor,
  size = 40,
}: {
  rows: [string, string][];
  labelColor: string;
  valueColor: string;
  size?: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 21, color: labelColor, letterSpacing: 1 }}>
            {label.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: fitValue(value, size),
              fontFamily: BOLD_FAMILY,
              fontWeight: 700,
              color: valueColor,
            }}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Cada empresa tem a sua arte; `faixa` é o padrão de quem ainda não escolheu. */
export async function bankCardImage(data: BankCardData): Promise<ImageResponse> {
  const bold = await loadBoldFont();
  const brand = data.brandColor ?? DEFAULT_BRAND;
  const ink = readableOn(brand);
  const style: CardStyle = CARD_STYLES.includes(data.cardStyle as CardStyle)
    ? (data.cardStyle as CardStyle)
    : "faixa";

  const logo: LogoArt | null = data.logo
    ? {
        src: `data:${data.logo.mime};base64,${Buffer.from(data.logo.bytes).toString("base64")}`,
        ratio: (() => {
          const size = imageSize(data.logo.bytes);
          return size ? size.width / size.height : 1;
        })(),
      }
    : null;

  const shell = {
    display: "flex",
    flexDirection: "column" as const,
    width: "100%",
    height: "100%",
    fontFamily: "sans-serif",
  };

  let content;

  if (style === "cartao") {
    // Fundo inteiro na cor da marca, com os dados num cartão branco flutuante.
    content = (
      <div style={{ ...shell, backgroundColor: brand, padding: 56, justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          {logo && <Logo logo={logo} height={128} />}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 20, color: ink.soft, letterSpacing: 2 }}>DADOS BANCÁRIOS</div>
            <div style={{ fontSize: 32, fontFamily: BOLD_FAMILY, fontWeight: 700, color: ink.text, lineHeight: 1.2 }}>
              {data.companyName}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            borderRadius: 28,
            padding: 44,
          }}
        >
          <Rows rows={data.rows} labelColor="#64748b" valueColor="#0f172a" size={38} />
        </div>
      </div>
    );
  } else if (style === "lateral") {
    // Coluna colorida à esquerda com a marca, dados no branco à direita.
    content = (
      <div style={{ ...shell, flexDirection: "row", backgroundColor: "#ffffff" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: 400,
            backgroundColor: brand,
            padding: 44,
          }}
        >
          {logo && <Logo logo={logo} width={312} />}
          <div style={{ display: "flex", height: 3, backgroundColor: ink.soft, margin: "32px 0" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 19, color: ink.soft, letterSpacing: 2 }}>DADOS BANCÁRIOS</div>
            <div
              style={{
                fontSize: 27,
                fontFamily: BOLD_FAMILY,
                fontWeight: 700,
                color: ink.text,
                lineHeight: 1.25,
              }}
            >
              {data.companyName}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "48px 52px",
          }}
        >
          <Rows rows={data.rows} labelColor="#94a3b8" valueColor="#0f172a" size={34} />
        </div>
      </div>
    );
  } else if (style === "minimalista") {
    // Papel branco, marca só num filete e no nome. Para logos coloridas.
    content = (
      <div style={{ ...shell, backgroundColor: "#ffffff", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logo && <Logo logo={logo} height={132} />}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 30, fontFamily: BOLD_FAMILY, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
              {data.companyName}
            </div>
            <div style={{ fontSize: 21, color: brand, letterSpacing: 2, marginTop: 4 }}>
              DADOS BANCÁRIOS
            </div>
          </div>
        </div>
        <div style={{ display: "flex", height: 5, backgroundColor: brand, margin: "36px 0 44px" }} />
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center" }}>
          <Rows rows={data.rows} labelColor="#94a3b8" valueColor="#0f172a" />
        </div>
      </div>
    );
  } else {
    // Faixa: cabeçalho na cor da marca, dados no branco abaixo.
    content = (
      <div style={{ ...shell, backgroundColor: "#ffffff" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            backgroundColor: brand,
            padding: "40px 56px",
          }}
        >
          {logo && <Logo logo={logo} height={140} />}
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 22, color: ink.soft, letterSpacing: 2 }}>DADOS BANCÁRIOS</div>
            <div style={{ fontSize: 32, fontFamily: BOLD_FAMILY, fontWeight: 700, color: ink.text, lineHeight: 1.2 }}>
              {data.companyName}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            padding: "40px 56px",
          }}
        >
          <Rows rows={data.rows} labelColor="#64748b" valueColor="#0f172a" />
        </div>
        <div style={{ display: "flex", height: 14, backgroundColor: brand }} />
      </div>
    );
  }

  return new ImageResponse(content, {
    width: 1080,
    height: 1080,
    fonts: bold ? [{ name: BOLD_FAMILY, data: bold, weight: 700, style: "normal" }] : undefined,
  });
}
