import { AvatarUploadForm } from "@/app/portal-colaborador/avatar-upload-form";

export function PerfilCartao({
  nome,
  avatarUrl,
  campos,
}: {
  nome: string;
  avatarUrl: string | null;
  campos: { rotulo: string; valor: string }[];
}) {
  return (
    <div className="mt-10 border border-fio bg-cartao p-6 sm:p-8">
      <AvatarUploadForm name={nome} avatarUrl={avatarUrl} />
      <dl className="mt-8 grid gap-6 border-t border-fio pt-8 sm:grid-cols-2">
        {campos.map((campo) => (
          <div key={campo.rotulo}>
            <dt className="text-[11px] font-medium uppercase tracking-[0.22em] text-areia">
              {campo.rotulo}
            </dt>
            <dd className="mt-1.5 break-words text-[15px] text-marfim">{campo.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
