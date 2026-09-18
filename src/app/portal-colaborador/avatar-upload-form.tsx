"use client";

import { useActionState } from "react";
import { updateAvatarAction, type UpdateAvatarState } from "@/lib/actions/profile";
import { buttonGhost } from "@/components/ui/styles";
import { Avatar } from "@/components/ui/avatar";

const initialState: UpdateAvatarState = {};

export function AvatarUploadForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, formAction, pending] = useActionState(updateAvatarAction, initialState);

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar name={name} src={avatarUrl} size={72} />
      <form action={formAction} className="flex min-w-0 flex-col gap-2">
        <label
          htmlFor="avatar"
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-areia"
        >
          Foto de perfil
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="max-w-full text-xs text-areia file:mr-3 file:cursor-pointer file:border file:border-solid file:border-fio-forte file:bg-transparent file:px-3 file:py-2 file:text-[11px] file:font-medium file:uppercase file:tracking-[0.14em] file:text-ouro hover:file:bg-ouro/10"
          />
          <button type="submit" disabled={pending} className={buttonGhost}>
            {pending ? "Enviando..." : "Salvar"}
          </button>
        </div>
        {state.error && (
          <p className="text-xs text-terracota" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
