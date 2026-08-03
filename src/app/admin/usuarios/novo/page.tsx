import { prisma } from "@/lib/prisma";
import { NovoUsuarioForm } from "./novo-usuario-form";

export default async function NovoUsuarioPage() {
  const companies = await prisma.company.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Novo usuário</h1>
      <NovoUsuarioForm companies={companies} />
    </div>
  );
}
