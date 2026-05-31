"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getString,
  getOptionalString,
  buildQuery,
  shortError,
} from "@/lib/cadastros/helpers";

const BASE = "/escalas";

function timeOrNull(v: string): string | null {
  // HTML input type="time" devolve "HH:MM" ou "" — Postgres aceita ambos para tipo TIME.
  return v ? v : null;
}

export async function upsertScale(formData: FormData) {
  let okMsg = "Escala criada.";
  try {
    const id = getString(formData, "id");
    const date = getString(formData, "date", { required: true });
    const scale_type = getString(formData, "scale_type", { required: true });
    const function_name = getString(formData, "function_name");
    const personKind = getString(formData, "person_kind", { required: true }); // "student" | "military"
    const personId = getString(formData, "person_id", { required: true });

    let student_id: string | null = null;
    let military_staff_id: string | null = null;
    if (personKind === "student") student_id = personId;
    else if (personKind === "military") military_staff_id = personId;
    else throw new Error('Selecione "Aluno" ou "Militar".');

    const platoon_id = getOptionalString(formData, "platoon_id");
    const start_time = timeOrNull(getString(formData, "start_time"));
    const end_time = timeOrNull(getString(formData, "end_time"));
    const location_id = getOptionalString(formData, "location_id");
    const uniform = getString(formData, "uniform");
    const notes = getString(formData, "notes");
    const publish_suggestion = formData.get("publish_suggestion") === "on";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      date,
      scale_type,
      function_name,
      student_id,
      military_staff_id,
      platoon_id,
      start_time,
      end_time,
      location_id,
      uniform,
      notes,
      publish_suggestion,
    };

    if (id) {
      const { error } = await supabase.from("duty_scales").update(payload).eq("id", id);
      if (error) throw error;
      okMsg = "Escala atualizada.";
    } else {
      const { error } = await supabase
        .from("duty_scales")
        .insert({ ...payload, created_by: user?.id, status: "rascunho" });
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function setScaleStatus(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const status = getString(formData, "status", { required: true });
    if (!["rascunho", "validada", "alterada", "cancelada", "publicada"].includes(status)) {
      throw new Error("Status inválido.");
    }
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status };
    if (status === "validada") {
      patch.validated_by = user?.id ?? null;
      patch.validated_at = new Date().toISOString();
    }
    const { error } = await supabase.from("duty_scales").update(patch).eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
