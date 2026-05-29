"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getString,
  getOptionalString,
  getInteger,
  buildQuery,
  shortError,
} from "@/lib/cadastros/helpers";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import {
  assertTransition,
  EVENT_TYPE_BY_TARGET,
  type RecordStatus,
} from "@/lib/validacao/status";
import { canEnterBulletin } from "@/lib/records/options";

function base(id: string): string {
  return `/validacao/${id}`;
}

/**
 * Carrega o registro, confere perfil admin-like e devolve { supabase, user, record }.
 * Lança Error em caso de problema (perfil, registro inexistente).
 */
async function loadGuarded(recordId: string) {
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    throw new Error("Apenas a Coordenação pode validar registros.");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data: record, error } = await supabase
    .from("records")
    .select("id, status")
    .eq("id", recordId)
    .maybeSingle();
  if (error) throw error;
  if (!record) throw new Error("Registro não encontrado.");

  return { supabase, user, record: record as { id: string; status: string } };
}

/** Insere uma linha de histórico para a transição. */
async function logEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: {
    recordId: string;
    from: string;
    to: RecordStatus;
    note: string;
    createdBy: string;
  },
) {
  const { error } = await supabase.from("record_events").insert({
    record_id: args.recordId,
    event_type: EVENT_TYPE_BY_TARGET[args.to] ?? args.to,
    from_status: args.from,
    to_status: args.to,
    note: args.note,
    created_by: args.createdBy,
  });
  if (error) throw error;
}

/** enviado → em revisão. */
export async function markInReview(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "em revisão");

    const { error } = await supabase
      .from("records")
      .update({ status: "em revisão", reviewed_by: user.id })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "em revisão",
      note: "",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro em revisão." })}`);
}

/**
 * em revisão → validado.
 * Aplica classificação, texto de publicação e (se publicável) inclusão no BI.
 * Invariante DT-003: só "publicável" pode entrar no BI; parte do BI só com inclusão.
 */
export async function validateRecord(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "validado");

    const classification = getString(formData, "classification", {
      required: true,
    });
    if (!["publicável", "interno", "restrito"].includes(classification)) {
      throw new Error("Classificação inválida.");
    }
    const publication_text = getString(formData, "publication_text");

    // Inclusão no BI só é possível para publicável (DT-003).
    const wantsInclude = getString(formData, "include_in_bulletin") === "on";
    const include_in_bulletin = canEnterBulletin(classification) && wantsInclude;

    // Parte do BI só faz sentido quando incluído.
    const partRaw = getInteger(formData, "bulletin_part", { min: 1, max: 5 });
    const bulletin_part = include_in_bulletin ? partRaw : null;

    const { error } = await supabase
      .from("records")
      .update({
        status: "validado",
        classification,
        publication_text,
        include_in_bulletin,
        bulletin_part,
        validated_by: user.id,
        validated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "validado",
      note: include_in_bulletin
        ? `Validado — entra no BI (parte ${bulletin_part ?? "?"}).`
        : `Validado — classificação ${classification}.`,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro validado." })}`);
}

/** em revisão → pendente de correção (motivo obrigatório). */
export async function returnForCorrection(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, record } = await loadGuarded(id);
    assertTransition(record.status, "pendente de correção");

    const note = getString(formData, "note", { required: true });

    const { error } = await supabase
      .from("records")
      .update({ status: "pendente de correção", coordination_note: note })
      .eq("id", id);
    if (error) throw error;

    await logEvent(supabase, {
      recordId: id,
      from: record.status,
      to: "pendente de correção",
      note,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Registro devolvido para correção." })}`);
}

/** Edição do texto de publicação sem transição de status (US-022). */
export async function updatePublicationText(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const profile = await getCurrentProfileName();
    if (!isAdminLike(profile)) {
      throw new Error("Apenas a Coordenação pode editar o texto de publicação.");
    }
    const publication_text = getOptionalString(formData, "publication_text") ?? "";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("records")
      .update({ publication_text })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Texto de publicação salvo." })}`);
}
