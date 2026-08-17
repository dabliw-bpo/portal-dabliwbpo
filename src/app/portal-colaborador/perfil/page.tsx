import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import { formatDateOnly } from "@/lib/format";
import { AvatarUploadForm } from "../avatar-upload-form";

export default async function PortalColaboradorPage() {
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

  const fields = [
    { label: "Nome", value: user.name },
    { label: "Email", value: user.email },
    { label: "Empresa", value: user.company?.name ?? "-" },
    { label: "Status", value: user.active ? "Ativo" : "Inativo" },
    { label: "Colaborador desde", value: formatDateOnly(user.createdAt) },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">Meu perfil</h1>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <AvatarUploadForm name={user.name} avatarUrl={getAvatarUrl(user.avatarPath)} />

        <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm text-slate-900">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
