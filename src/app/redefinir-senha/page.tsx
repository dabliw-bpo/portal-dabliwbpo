import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Redefinir senha</h1>
        <p className="mt-1 text-sm text-slate-500">Escolha uma nova senha para sua conta.</p>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-6 text-sm text-red-600" role="alert">
            Link inválido.{" "}
            <Link href="/esqueci-senha" className="underline">
              Solicite um novo
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
