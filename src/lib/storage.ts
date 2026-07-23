import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

const STORAGE_DIR = path.resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage/documents");

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : "";
}

export async function saveFile(buffer: Buffer, originalFileName: string, id: string): Promise<string> {
  await mkdir(STORAGE_DIR, { recursive: true });
  const relativePath = `${id}${safeExtension(originalFileName)}`;
  await writeFile(path.join(STORAGE_DIR, relativePath), buffer);
  return relativePath;
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  const resolved = path.resolve(STORAGE_DIR, relativePath);
  if (!resolved.startsWith(STORAGE_DIR)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  return readFile(resolved);
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  const resolved = path.resolve(STORAGE_DIR, relativePath);
  if (!resolved.startsWith(STORAGE_DIR)) {
    throw new Error("Caminho de arquivo inválido.");
  }
  await unlink(resolved).catch(() => undefined);
}
