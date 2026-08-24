import { cookies } from "next/headers";
import {
  COOKIE_PROPOSTA,
  PROPOSTAS,
  lerProposta,
  paginaDeSenha,
  senhaConfere,
  tokenConfere,
  tokenPara,
} from "@/lib/propostas";

const HTML = {
  "Content-Type": "text/html; charset=utf-8",
  // Proposta comercial: fora dos buscadores, e sem ficar em cache de CDN,
  // porque o que se responde depende do cookie de quem pede.
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposta = PROPOSTAS[slug];
  if (!proposta) {
    return new Response("Proposta não encontrada.", { status: 404 });
  }

  const jar = await cookies();
  if (!tokenConfere(slug, jar.get(`${COOKIE_PROPOSTA}_${slug}`)?.value)) {
    return new Response(paginaDeSenha(proposta.titulo), { headers: HTML });
  }

  const html = await lerProposta(slug);
  if (!html) {
    return new Response("Proposta indisponível.", { status: 500 });
  }
  return new Response(html, { headers: HTML });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const proposta = PROPOSTAS[slug];
  if (!proposta) {
    return new Response("Proposta não encontrada.", { status: 404 });
  }

  const form = await request.formData();
  const senha = String(form.get("senha") ?? "");

  if (!(await senhaConfere(senha))) {
    return new Response(paginaDeSenha(proposta.titulo, "Senha incorreta. Tente novamente."), {
      status: 401,
      headers: HTML,
    });
  }

  const jar = await cookies();
  jar.set(`${COOKIE_PROPOSTA}_${slug}`, tokenPara(slug), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/propostas/${slug}`,
    maxAge: 60 * 60 * 24 * 30,
  });

  // 303 para o navegador trocar o POST por um GET e o refresh não reenviar a senha.
  return new Response(null, { status: 303, headers: { Location: `/propostas/${slug}` } });
}
