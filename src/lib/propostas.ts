import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";

/**
 * As propostas comerciais publicadas. Ficam fora de `public/` de propósito: lá
 * o arquivo é servido direto pelo CDN e nenhuma senha seria consultada.
 */
export const PROPOSTAS: Record<string, { file: string; titulo: string }> = {
  "clinica-fisioterapia": {
    file: "clinica-fisioterapia.html",
    titulo: "Proposta DABLIW BPO — Clínica de Fisioterapia",
  },
};

/**
 * A senha entra aqui como hash, não como texto. É um portão leve — protege a
 * tabela de preços de quem topa com o link, não de quem ataca a sério — mas
 * não há motivo para deixar a senha legível no repositório.
 */
const SENHA_HASH = "$2b$10$uHYlSGV96IXeD1xlqH1rC..43Pw.dBOF12Ob1JDntmtPphLITRAHS";

export const COOKIE_PROPOSTA = "proposta_acesso";

export async function senhaConfere(informada: string): Promise<boolean> {
  return bcrypt.compare(informada, SENHA_HASH);
}

/** Prova de que o portão foi aberto, assinada com o segredo da aplicação. */
export function tokenPara(slug: string): string {
  const segredo = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", segredo).update(`proposta:${slug}`).digest("hex");
}

export function tokenConfere(slug: string, valor: string | undefined): boolean {
  if (!valor) return false;
  const esperado = Buffer.from(tokenPara(slug));
  const recebido = Buffer.from(valor);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export async function lerProposta(slug: string): Promise<string | null> {
  const proposta = PROPOSTAS[slug];
  if (!proposta) return null;
  try {
    return await readFile(path.join(process.cwd(), "src/content/propostas", proposta.file), "utf8");
  } catch {
    return null;
  }
}

/** A porta: mesma paleta da proposta, para não parecer outro site. */
export function paginaDeSenha(titulo: string, erro?: string): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Cormorant+Garamond:wght@500;600&family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{ --bg:#0e0d0a; --surface:#161409; --ink:#f2ede1; --ink-muted:#a89e89;
         --line:rgba(242,237,225,0.14); --line-strong:rgba(242,237,225,0.28);
         --accent:#c9a96e; --accent-ink:#191506; --erro:#e5876f; }
  @media (prefers-color-scheme: light){
    :root:not([data-theme="dark"]){ --bg:#faf6ec; --surface:#ffffff; --ink:#1c1810; --ink-muted:#6d6350;
      --line:rgba(28,24,16,0.12); --line-strong:rgba(28,24,16,0.22); --accent:#92703a; --accent-ink:#fbf7ee; --erro:#a4442a; }
  }
  *{box-sizing:border-box}
  body{ margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
        background:var(--bg); color:var(--ink); padding:28px;
        font-family:'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .caixa{ width:100%; max-width:400px; background:var(--surface); border:1px solid var(--line-strong);
          border-radius:16px; padding:38px 32px 32px; }
  .mark{ font-family:'Anton',sans-serif; font-size:1.15rem; margin-bottom:26px; }
  .mark .dot{ color:var(--accent) }
  h1{ font-family:'Cormorant Garamond',Georgia,serif; font-weight:600; font-size:1.65rem;
      line-height:1.15; margin:0 0 10px; }
  p{ color:var(--ink-muted); font-size:0.92rem; margin:0 0 24px; }
  label{ display:block; font-size:0.68rem; letter-spacing:0.1em; text-transform:uppercase;
         color:var(--ink-muted); margin-bottom:8px; }
  input{ width:100%; padding:12px 14px; border-radius:9px; border:1px solid var(--line-strong);
         background:transparent; color:var(--ink); font-size:1rem; font-family:inherit; }
  input:focus{ outline:2px solid var(--accent); outline-offset:1px; border-color:transparent; }
  button{ width:100%; margin-top:18px; padding:12px 18px; border:0; border-radius:999px;
          background:var(--accent); color:var(--accent-ink); font-family:inherit;
          font-size:0.9rem; font-weight:600; cursor:pointer; }
  .erro{ color:var(--erro); font-size:0.86rem; margin:14px 0 0; }
  footer{ margin-top:26px; padding-top:18px; border-top:1px solid var(--line);
          font-size:0.78rem; color:var(--ink-muted); }
  footer a{ color:inherit }
</style>
</head>
<body>
  <main class="caixa">
    <div class="mark">DABLIW<span class="dot">.</span></div>
    <h1>Proposta protegida</h1>
    <p>Informe a senha que você recebeu junto com este link.</p>
    <form method="post">
      <label for="senha">Senha de acesso</label>
      <input id="senha" name="senha" type="password" autocomplete="current-password" autofocus required>
      <button type="submit">Abrir proposta</button>
      ${erro ? `<p class="erro">${erro}</p>` : ""}
    </form>
    <footer>Dúvidas? <a href="https://wa.me/5565992536122">Falar no WhatsApp</a></footer>
  </main>
</body>
</html>
`;
}
