"use client";

import { useActionState } from "react";
import { updateAvatarAction, type UpdateAvatarState } from "@/lib/actions/profile";
import { buttonGhost } from "@/components/ui/styles";
import { Avatar } from "@/components/ui/avatar";

const initialState: UpdateAvatarState = {};

export function AvatarUploadForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, formAction, pending] = useActionState(updateAvatarAction, initialState);

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={avatarUrl} size={64} />
      <form action={formAction} className="flex flex-col gap-2">
        <label htmlFor="avatar" className="text-xs font-medium text-slate-700">
          Foto de perfil
        </label>
        <div className="flex items-center gap-2">
          <input
            id="avatar"
            name="avatar"
            type="file"
            accept=".png,.jpg,.jpeg,.webp"
            className="text-xs text-slate-500 file:mr-2 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
          <button type="submit" disabled={pending} className={buttonGhost}>
            {pending ? "Enviando..." : "Salvar"}
          </button>
        </div>
        {state.error && (
          <p className="text-xs text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
