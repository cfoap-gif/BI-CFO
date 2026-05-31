"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getString,
  getInteger,
  buildQuery,
  shortError,
} from "@/lib/cadastros/helpers";

const BASE = "/cadastros/pelotoes";

export async function upsertPlatoon(formData: FormData) {
  let okMsg = "Pelotão criado.";
  try {
    const id = getString(formData, "id");
    const name = getString(formData, "name", { required: true });
    const description = getString(formData, "description");
    const cfo_year = getInteger(formData, "cfo_year", { min: 2000, max: 2099 });

    const supabase = await createSupabaseServerClient();

    if (id) {
      const { error } = await supabase
        .from("platoons")
        .update({ name, description, cfo_year })
        .eq("id", id);
      if (error) throw error;
      okMsg = "Pelotão atualizado.";
    } else {
      const { error } = await supabase
        .from("platoons")
        .insert({ name, description, cfo_year });
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function togglePlatoonActive(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("platoons")
      .update({ active: next })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
