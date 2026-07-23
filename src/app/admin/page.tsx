import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">
        Bem-vindo, {session?.user?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Papel: {session?.user?.role}</p>
    </div>
  );
}
