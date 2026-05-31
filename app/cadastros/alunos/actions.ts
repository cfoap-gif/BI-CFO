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

const BASE = "/cadastros/alunos";

export async function upsertStudent(formData: FormData) {
  let okMsg = "Aluno criado.";
  try {
    const id = getString(formData, "id");
    const student_number = getInteger(formData, "student_number", {
      required: true,
      min: 1,
      max: 9999,
    });
    const full_name = getString(formData, "full_name", { required: true });
    const war_name = getString(formData, "war_name", { required: true });
    const platoon_id = getString(formData, "platoon_id", { required: true });
    const registration_number = getOptionalString(formData, "registration_number");
    const situation = getString(formData, "situation", { required: true });
    const phone = getOptionalString(formData, "phone");

    const supabase = await createSupabaseServerClient();
    const payload = {
      student_number,
      full_name,
      war_name,
      platoon_id,
      registration_number,
      situation,
      phone,
    };

    if (id) {
      const { error } = await supabase.from("students").update(payload).eq("id", id);
      if (error) throw error;
      okMsg = "Aluno atualizado.";
    } else {
      const { error } = await supabase.from("students").insert(payload);
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: okMsg })}`);
}

export async function toggleStudentActive(formData: FormData) {
  try {
    const id = getString(formData, "id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("students")
      .update({ active: next })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}${buildQuery({ ok: "Status alterado." })}`);
}
