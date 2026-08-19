/**
 * Lê largura e altura direto do cabeçalho do arquivo, sem decodificar a
 * imagem. Serve para dar à logo de cada empresa um espaço com a proporção
 * certa: as logos vão de quadradas (AMMLOG) a faixas bem largas (Invicta), e
 * encaixar todas num quadrado deixa umas minúsculas e outras espremidas.
 */
export type ImageSize = { width: number; height: number };

function readPng(bytes: Uint8Array): ImageSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 24 || view.getUint32(0) !== 0x89504e47) return null;
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

/** Percorre os marcadores até o SOF, que carrega as dimensões reais. */
function readJpeg(bytes: Uint8Array): ImageSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (view.getUint8(offset) !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = view.getUint8(offset + 1);
    // Marcadores sem payload (padding, RSTn, SOI/EOI).
    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const length = view.getUint16(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
}

function readWebp(bytes: Uint8Array): ImageSize | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 30 || view.getUint32(0) !== 0x52494646) return null;
  if (view.getUint32(8) !== 0x57454250) return null;

  const chunk = view.getUint32(12);
  // "VP8X": largura e altura menos um, em 24 bits little-endian.
  if (chunk === 0x56503858) {
    const at = (i: number) =>
      view.getUint8(i) | (view.getUint8(i + 1) << 8) | (view.getUint8(i + 2) << 16);
    return { width: at(24) + 1, height: at(27) + 1 };
  }
  // "VP8 ": quadro lossy simples.
  if (chunk === 0x56503820) {
    return {
      width: view.getUint16(26, true) & 0x3fff,
      height: view.getUint16(28, true) & 0x3fff,
    };
  }
  return null;
}

export function imageSize(bytes: Uint8Array): ImageSize | null {
  const size = readPng(bytes) ?? readJpeg(bytes) ?? readWebp(bytes);
  return size && size.width > 0 && size.height > 0 ? size : null;
}
