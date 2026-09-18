import { CartaoAcesso } from "@/components/portal/cartao-acesso";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function EsqueciSenhaPage() {
  return (
    <CartaoAcesso
      titulo="Esqueceu a senha?"
      descricao="Informe o seu e-mail e enviamos um link para criar uma senha nova."
      voltar={{ href: "/login", rotulo: "Voltar para o login" }}
    >
      <ForgotPasswordForm />
    </CartaoAcesso>
  );
}
