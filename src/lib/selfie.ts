import { createHash } from "node:crypto";
import { imageSize } from "@/lib/image-size";

/**
 * Selfie tirada no ato da assinatura, anexada ao comprovante.
 *
 * É dado pessoal sensível: o arquivo vai para o storage privado, só o admin
 * abre a imagem, e o relatório de auditoria leva a foto junto com o código
 * SHA-256 dela. Este módulo só valida o que chega do navegador e decide quem é
 * obrigado a tirar; quem grava é a action de assinatura.
 */

/** Uma selfie reduzida a 640 px pesa uns 60 KB; acima disso não é o que o portal gera. */
const MAX_SELFIE_DATA_URL_CHARS = 350_000;
const MIN_SELFIE_BYTES = 4_000;
const MIN_SIDE = 240;
const MAX_SIDE = 1280;

const JPEG_DATA_URL = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

export const SELFIE_SOURCES = {
  ao_vivo: "capturada ao vivo, com a câmera aberta pelo portal",
  camera_do_aparelho: "tirada pelo aplicativo de câmera do aparelho",
} as const;
export type SelfieSource = keyof typeof SELFIE_SOURCES;

/** Por que a assinatura saiu sem selfie. Vai para o comprovante, em palavras. */
export const SELFIE_SKIP_REASONS = {
  sem_suporte: "o navegador do aparelho não permite abrir a câmera",
  permissao_negada: "a pessoa não liberou o acesso à câmera",
  erro_camera: "a câmera do aparelho não abriu",
  falha_ao_salvar: "a foto foi tirada, mas não pôde ser guardada",
} as const;
export type SelfieSkipReason = keyof typeof SELFIE_SKIP_REASONS;

export function parseSelfieSource(value: unknown): SelfieSource | null {
  return typeof value === "string" && value in SELFIE_SOURCES ? (value as SelfieSource) : null;
}

/** Só os motivos que o navegador pode declarar; "falha_ao_salvar" é do servidor. */
export function parseSelfieSkipReason(value: unknown): SelfieSkipReason | null {
  return value === "sem_suporte" || value === "permissao_negada" || value === "erro_camera"
    ? value
    : null;
}

export type ParsedSelfie = { buffer: Buffer; hash: string };

/**
 * Aceita apenas um JPEG em data URL, do tamanho que o portal produz. Confere o
 * cabeçalho e as dimensões do arquivo, e não só o texto do data URL: assim
 * nada além de uma foto é guardado e depois devolvido ao admin como imagem.
 */
export function parseSelfieImage(value: unknown): ParsedSelfie | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.length > MAX_SELFIE_DATA_URL_CHARS || !JPEG_DATA_URL.test(trimmed)) {
    return null;
  }

  const buffer = Buffer.from(trimmed.slice(trimmed.indexOf(",") + 1), "base64");
  if (buffer.length < MIN_SELFIE_BYTES) return null;

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (!isJpeg) return null;

  const size = imageSize(buffer);
  if (!size) return null;
  if (size.width < MIN_SIDE || size.height < MIN_SIDE) return null;
  if (size.width > MAX_SIDE || size.height > MAX_SIDE) return null;

  return { buffer, hash: createHash("sha256").update(buffer).digest("hex") };
}

/**
 * Quem precisa tirar a selfie. Sem `SELFIE_PILOTO`, todos. Com ela (e-mails
 * separados por vírgula), só quem está na lista: serve para validar a tela num
 * celular de verdade antes de pedir a foto a todos os colaboradores.
 */
export function selfieExigida(email: string | null | undefined): boolean {
  const piloto = process.env.SELFIE_PILOTO?.trim();
  if (!piloto) return true;
  if (!email) return false;
  return piloto
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

/** A frase do comprovante sobre a selfie, para a tela e para o relatório. */
export function describeSelfie(input: {
  hasSelfie: boolean;
  source: string | null;
  skipReason: string | null;
}): string | null {
  if (input.hasSelfie) {
    const how =
      input.source && input.source in SELFIE_SOURCES
        ? SELFIE_SOURCES[input.source as SelfieSource]
        : "tirada no ato da assinatura";
    return `Selfie ${how}.`;
  }
  if (input.skipReason && input.skipReason in SELFIE_SKIP_REASONS) {
    return `Assinou sem selfie: ${SELFIE_SKIP_REASONS[input.skipReason as SelfieSkipReason]}.`;
  }
  return null;
}
