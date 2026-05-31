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

const BASE = "/cadastros/disciplinas";

export async function upsertDiscipline(formData: FormData) {
  let okMsg = "Disciplina criada.";
  try {
    const id = getString(formData, "id");
    const name = getString(formData, "name", { required: true });
    const cfo_year = getInteger(formData, "cfo_year", { min: 2000, max: 2099 });
    const workload_hours = getInteger(formData, "workload_hours", { min: 0, max: 5000 }) ?? 0;
    const discipline_type = getString(formData, "discipline_type", { required: true });
    const main_instructor_id = getOptionalString(formData, "main_instructor_id");

    const supabase = await createSupabaseServerClient();
    const payload = {
      name,
      cfo_year,
      workload_hours,
      discipline_type,
      main_instructor_id,
    };

    if (id) {
      const { error } = await supabase.from("disciplines").update(payload).eq("id", id);
      if (error) throw error;
      okMsg = "Disciplina atualizada.";
    } else {
      const { error } = await supabase.from("disciplines").insert(payload);
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function toggleDisciplineActive(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("disciplines")
      .update({ active: next })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
