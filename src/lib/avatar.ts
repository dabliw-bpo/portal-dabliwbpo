export function getAvatarUrl(avatarPath: string | null): string | null {
  if (!avatarPath) {
    return null;
  }
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }
  return `${supabaseUrl}/storage/v1/object/public/avatars/${avatarPath}`;
}
