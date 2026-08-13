import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "documents";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não configurados.");
  }

  client = createClient(url, serviceRoleKey);
  return client;
}

function safeExtension(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : "";
}

export async function saveFile(buffer: Buffer, originalFileName: string, id: string): Promise<string> {
  const relativePath = `${id}${safeExtension(originalFileName)}`;
  const { error } = await getClient().storage.from(BUCKET).upload(relativePath, buffer, { upsert: false });
  if (error) {
    throw new Error(`Falha ao salvar arquivo: ${error.message}`);
  }
  return relativePath;
}

export async function readStoredFile(relativePath: string): Promise<Buffer> {
  const { data, error } = await getClient().storage.from(BUCKET).download(relativePath);
  if (error || !data) {
    throw new Error(`Falha ao ler arquivo: ${error?.message ?? "não encontrado"}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Reads from the public `avatars` bucket — user photos and company logos. */
export async function readPublicAsset(relativePath: string): Promise<Uint8Array> {
  const { data, error } = await getClient().storage.from("avatars").download(relativePath);
  if (error || !data) {
    throw new Error(`Falha ao ler imagem: ${error?.message ?? "não encontrada"}`);
  }
  return new Uint8Array(await data.arrayBuffer());
}

export async function deleteStoredFile(relativePath: string): Promise<void> {
  await getClient().storage.from(BUCKET).remove([relativePath]);
}
