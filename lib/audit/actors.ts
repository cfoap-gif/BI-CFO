import type { SupabaseClient } from "@supabase/supabase-js";

export const UNKNOWN_AUDIT_ACTOR = "Usuário não identificado";

export type AuditActorRow = {
  user_id: string;
  login: string | null;
  full_name: string | null;
  war_name: string | null;
  profile_name: string | null;
  active: boolean | null;
};

export function formatAuditActorName(
  actor: Pick<AuditActorRow, "war_name" | "full_name" | "login"> | null | undefined,
): string {
  if (!actor) return UNKNOWN_AUDIT_ACTOR;

  const name = [actor.war_name, actor.full_name, actor.login]
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value));

  return name ?? UNKNOWN_AUDIT_ACTOR;
}

export function uniqueAuditActorIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id?.trim()))));
}

export async function loadAuditActorDisplayMap(
  supabase: SupabaseClient,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const userIds = uniqueAuditActorIds(ids);
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc("audit_actor_display_by_ids", {
    p_user_ids: userIds,
  });
  if (error) return new Map();

  const rows = (data ?? []) as AuditActorRow[];
  return new Map(
    rows.map((row) => [row.user_id, formatAuditActorName(row)]),
  );
}
