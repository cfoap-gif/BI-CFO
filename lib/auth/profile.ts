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

/** Perfis que operam o Livro de Dia (preenchem ou validam). */
export const DAILY_BOOK_USERS: readonly ProfileName[] = [
  "Administrador",
  "Coordenação",
  "Aluno de Dia ao Corpo de Alunos",
  "Aluno de Dia ao Pelotão",
] as const;

/** Perfis que podem criar/editar registros (records). Inclui Instrutor. */
export const RECORD_WRITERS: readonly ProfileName[] = [
  "Administrador",
  "Coordenação",
  "Aluno de Dia ao Corpo de Alunos",
  "Aluno de Dia ao Pelotão",
  "Instrutor",
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

export function isDailyBookUser(profile: ProfileName | null): boolean {
  return profile !== null && DAILY_BOOK_USERS.includes(profile);
}

export function isRecordWriter(profile: ProfileName | null): boolean {
  return profile !== null && RECORD_WRITERS.includes(profile);
}
