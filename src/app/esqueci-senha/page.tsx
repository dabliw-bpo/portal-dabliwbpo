import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function EsqueciSenhaPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Esqueceu sua senha?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Informe seu e-mail e enviaremos um link para redefinir a senha.
        </p>
        <ForgotPasswordForm />
        <Link
          href="/login"
          className="mt-4 block text-center text-sm text-slate-500 underline hover:text-slate-900"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
