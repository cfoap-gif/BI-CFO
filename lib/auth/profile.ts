import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Perfis válidos do sistema (espelha public.profiles.name).
 * Mantenha em sincronia com `supabase/migrations/0002_seed_profiles.sql`.
 */
export const PROFILE_NAMES = [
  "Administrador",
  "Coordenação",
  "Coordenador de Pelotão",
  "Aluno de Dia ao Corpo de Alunos",
  "Aluno de Dia ao Pelotão",
  "Instrutor",
  "Consulta",
] as const;

export type ProfileName = (typeof PROFILE_NAMES)[number];

export const ADMIN_LIKE: readonly ProfileName[] = [
  "Administrador",
  "Coordenação",
] as const;

/**
 * Retorna o nome do perfil do usuário autenticado (ou null).
 * Lê via SQL `public.user_profile_name()` (security definer) para evitar
 * problemas com RLS — a função tem grant para `authenticated`.
 */
export async function getCurrentProfileName(): Promise<ProfileName | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("user_profile_name");
  if (error || !data) return null;
  return (PROFILE_NAMES as readonly string[]).includes(data as string)
    ? (data as ProfileName)
    : null;
}

export function isAdminLike(profile: ProfileName | null): boolean {
  return profile !== null && ADMIN_LIKE.includes(profile);
}
