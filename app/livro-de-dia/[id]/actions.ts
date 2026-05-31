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

function base(id: string): string {
  return `/livro-de-dia/${id}`;
}

export async function updateDailyBookHeader(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const expected = getInteger(formData, "expected_effective", { min: 0, max: 9999 });
    const present = getInteger(formData, "present_effective", { min: 0, max: 9999 });
    const general_summary = getString(formData, "general_summary");
    const service_passage = getString(formData, "service_passage");
    const student_duty_ca_id = getOptionalString(formData, "student_duty_ca_id");

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("daily_books")
      .update({
        expected_effective: expected,
        present_effective: present,
        general_summary,
        service_passage,
        student_duty_ca_id,
      })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Livro atualizado." })}`);
}

export async function setDailyBookStatus(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  const status = getString(formData, "status", { required: true });
  try {
    if (
      ![
        "rascunho",
        "enviado",
        "em revisão",
        "pendente de correção",
        "validado",
        "arquivado",
      ].includes(status)
    ) {
      throw new Error("Status inválido.");
    }
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { status };
    const now = new Date().toISOString();
    if (status === "enviado") {
      patch.submitted_by = user?.id ?? null;
      patch.submitted_at = now;
    } else if (status === "em revisão") {
      patch.reviewed_by = user?.id ?? null;
      patch.reviewed_at = now;
    } else if (status === "validado") {
      patch.validated_by = user?.id ?? null;
      patch.validated_at = now;
    }
    const { error } = await supabase.from("daily_books").update(patch).eq("id", id);
    if (error) throw error;

    // Quando o livro é enviado, marca os records dele em rascunho como "enviado".
    if (status === "enviado") {
      await supabase
        .from("records")
        .update({ status: "enviado", submitted_by: user?.id ?? null })
        .eq("daily_book_id", id)
        .eq("status", "rascunho");
    }
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Status alterado." })}`);
}

export async function upsertRecord(formData: FormData) {
  const dailyBookId = getString(formData, "daily_book_id", { required: true });
  try {
    const id = getString(formData, "id");
    const record_type = getString(formData, "record_type", { required: true });
    const reference_date = getString(formData, "reference_date", { required: true });
    const title = getString(formData, "title");
    const original_description = getString(formData, "original_description", {
      required: true,
    });
    const student_id = getOptionalString(formData, "student_id");
    const platoon_id = getOptionalString(formData, "platoon_id");
    const discipline_id = getOptionalString(formData, "discipline_id");
    const location_id = getOptionalString(formData, "location_id");
    const responsible_staff_id = getOptionalString(formData, "responsible_staff_id");
    const bulletin_part = getInteger(formData, "bulletin_part", { min: 1, max: 5 });

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      record_type,
      reference_date,
      title,
      original_description,
      student_id,
      platoon_id,
      discipline_id,
      location_id,
      responsible_staff_id,
      bulletin_part,
      daily_book_id: dailyBookId,
      source_type: "daily_book",
      source_id: dailyBookId,
    };

    if (id) {
      const { error } = await supabase.from("records").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("records")
        .insert({ ...payload, created_by: user?.id, status: "rascunho" });
      if (error) throw error;
    }
  } catch (e) {
    redirect(`${base(dailyBookId)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(dailyBookId));
  redirect(`${base(dailyBookId)}${buildQuery({ ok: "Registro salvo." })}`);
}

export async function cancelRecord(formData: FormData) {
  const dailyBookId = getString(formData, "daily_book_id", { required: true });
  try {
    const id = getString(formData, "id", { required: true });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("records")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(dailyBookId)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(dailyBookId));
  redirect(`${base(dailyBookId)}${buildQuery({ ok: "Registro cancelado." })}`);
}
