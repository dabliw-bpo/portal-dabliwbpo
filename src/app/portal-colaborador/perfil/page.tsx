import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import { formatDateOnly } from "@/lib/format";
import { PerfilCartao } from "@/components/portal/perfil-cartao";
import { Sobrelinha } from "@/components/portal/sobrelinha";

export default async function PortalColaboradorPerfilPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { company: true },
  });

  if (!user) {
    redirect("/login");
  }

  const campos = [
    { rotulo: "Nome", valor: user.name },
    { rotulo: "E-mail", valor: user.email },
    { rotulo: "Empresa", valor: user.company?.name ?? "—" },
    { rotulo: "Status", valor: user.active ? "Ativo" : "Inativo" },
    { rotulo: "Colaborador desde", valor: formatDateOnly(user.createdAt) },
  ];

  return (
    <div>
      <Sobrelinha>Seus dados no portal</Sobrelinha>
      <h1 className="mt-5 font-serifa text-5xl font-medium leading-none text-marfim sm:text-6xl">
        Meu perfil
      </h1>
      <PerfilCartao nome={user.name} avatarUrl={getAvatarUrl(user.avatarPath)} campos={campos} />
    </div>
  );
}
