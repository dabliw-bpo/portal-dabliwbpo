/** A handwritten signature drawing is small; larger payloads are not strokes. */
export const MAX_SIGNATURE_IMAGE_BYTES = 400_000;

const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Accepts only a base64 PNG data URL, so nothing but an image produced by the
 * signature pad can be stored and later rendered back into an <img>. Returns
 * the normalized value, or null when the input is not a usable signature.
 */
export function parseSignatureImage(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length > MAX_SIGNATURE_IMAGE_BYTES || !PNG_DATA_URL.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Motivos de recusa oferecidos ao admin. O texto vai no e-mail ao
 * colaborador e fica no histórico; "outro" pede uma explicação livre.
 */
export const SIGNATURE_REJECTION_REASONS = {
  ilegivel: "Assinatura ilegível ou incompleta",
  outra_pessoa: "Assinatura com o nome de outra pessoa",
} as const;
