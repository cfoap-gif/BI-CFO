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

const BASE = "/livro-de-dia";

export async function createDailyBook(formData: FormData) {
  try {
    const date = getString(formData, "date", { required: true });
    const course_label = getString(formData, "course_label") || "Geral";
    const student_duty_ca_id = getOptionalString(formData, "student_duty_ca_id");

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from("daily_books")
      .insert({
        date,
        course_label,
        student_duty_ca_id,
        created_by: user?.id,
        status: "rascunho",
      })
      .select("id")
      .single();
    if (error) throw error;

    revalidatePath(BASE);
    redirect(`${BASE}/${created.id}`);
  } catch (e) {
    // redirect() lança um erro especial que NÃO deve ser tratado como falha.
    if (e instanceof Error && e.message.startsWith("NEXT_REDIRECT")) throw e;
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
}
