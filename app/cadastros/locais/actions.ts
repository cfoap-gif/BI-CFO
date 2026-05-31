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

const BASE = "/cadastros/locais";

export async function upsertLocation(formData: FormData) {
  let okMsg = "Local criado.";
  try {
    const id = getString(formData, "id");
    const name = getString(formData, "name", { required: true });
    const description = getString(formData, "description");
    const address = getOptionalString(formData, "address");
    const location_type = getString(formData, "location_type", { required: true });

    const supabase = await createSupabaseServerClient();
    if (id) {
      const { error } = await supabase
        .from("locations")
        .update({ name, description, address, location_type })
        .eq("id", id);
      if (error) throw error;
      okMsg = "Local atualizado.";
    } else {
      const { error } = await supabase
        .from("locations")
        .insert({ name, description, address, location_type });
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function toggleLocationActive(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("locations")
      .update({ active: next })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
