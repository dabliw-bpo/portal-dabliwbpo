import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { CartaoAcesso } from "@/components/portal/cartao-acesso";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect(homePathForRole(session.user.role));
  }

  const { callbackUrl } = await searchParams;

  return (
    <CartaoAcesso
      titulo="Entrar no portal"
      descricao="Use o e-mail ou o CPF cadastrados e a sua senha."
      voltar={{ href: "/", rotulo: "Voltar ao site da DABLIW BPO" }}
    >
      <LoginForm callbackUrl={callbackUrl ?? "/"} />
    </CartaoAcesso>
  );
}
