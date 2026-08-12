import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { homePathForRole } from "@/lib/authz";
import { buttonGhost } from "@/components/ui/styles";
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
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">Portal de Documentos</h1>
          <p className="mt-1 text-sm text-slate-500">Entre com seu email e senha.</p>
          <LoginForm callbackUrl={callbackUrl ?? "/"} />
        </div>

        <div className="mt-4 flex justify-center">
          <Link href="/" className={buttonGhost}>
            <span aria-hidden>←</span> Voltar ao site da DABLIW BPO
          </Link>
        </div>
      </div>
    </div>
  );
}
