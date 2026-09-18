import Link from "next/link";
import { CartaoAcesso } from "@/components/portal/cartao-acesso";
import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <CartaoAcesso
      titulo="Criar senha nova"
      descricao="Escolha a senha que você vai usar para entrar no portal."
      voltar={{ href: "/login", rotulo: "Voltar para o login" }}
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <p className="mt-8 text-sm text-terracota" role="alert">
          Este link não é válido.{" "}
          <Link href="/esqueci-senha" className="text-ouro underline hover:text-ouro-claro">
            Peça um novo
          </Link>
          .
        </p>
      )}
    </CartaoAcesso>
  );
}
