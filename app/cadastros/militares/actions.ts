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

const BASE = "/cadastros/militares";

export async function upsertMilitary(formData: FormData) {
  let okMsg = "Militar criado.";
  try {
    const id = getString(formData, "id");
    const rank = getOptionalString(formData, "rank");
    const full_name = getString(formData, "full_name", { required: true });
    const war_name = getOptionalString(formData, "war_name");
    const registration_number = getOptionalString(formData, "registration_number");
    const staff_type = getString(formData, "staff_type", { required: true });
    const phone = getOptionalString(formData, "phone");

    const supabase = await createSupabaseServerClient();
    const payload = { rank, full_name, war_name, registration_number, staff_type, phone };
    if (id) {
      const { error } = await supabase.from("military_staff").update(payload).eq("id", id);
      if (error) throw error;
      okMsg = "Militar atualizado.";
    } else {
      const { error } = await supabase.from("military_staff").insert(payload);
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function toggleMilitaryActive(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("military_staff")
      .update({ active: next })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
