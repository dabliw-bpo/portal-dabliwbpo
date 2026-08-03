import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

export default async function AlterarSenhaPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Defina uma nova senha</h1>
        <p className="mt-1 text-sm text-slate-500">
          {session.user.mustChangePassword
            ? "Por segurança, troque a senha temporária antes de continuar."
            : "Escolha uma nova senha para sua conta."}
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
