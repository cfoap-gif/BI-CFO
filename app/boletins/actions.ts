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
import { bulletinType } from "@/lib/boletins/status";

const BASE = "/boletins";

export async function createBulletin(formData: FormData) {
  let newId: string | null = null;
  try {
    const profile = await getCurrentProfileName();
    if (!isAdminLike(profile)) {
      throw new Error("Apenas a Coordenação pode criar boletins.");
    }

    const number = getInteger(formData, "number", { required: true, min: 1, max: 99999 });
    const year = getInteger(formData, "year", { required: true, min: 2000, max: 2099 });
    const publication_date = getOptionalString(formData, "publication_date");
    const start_date = getString(formData, "start_date", { required: true });
    const end_date = getString(formData, "end_date", { required: true });

    if (end_date < start_date) {
      throw new Error("A data final não pode ser anterior à data inicial.");
    }
    const type = bulletinType(start_date, end_date);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from("bulletins")
      .insert({
        number,
        year,
        publication_date,
        start_date,
        end_date,
        type,
        status: "rascunho",
        created_by: user?.id ?? null,
      })
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        throw new Error(`Já existe um BI nº ${number} no ano ${year}.`);
      }
      throw error;
    }

    await supabase.from("bulletin_events").insert({
      bulletin_id: created.id,
      event_type: "criado",
      note: `BI ${type} criado (${start_date} a ${end_date}).`,
      created_by: user?.id ?? null,
    });
    newId = created.id;
  } catch (e) {
    redirect(`${BASE}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(BASE);
  redirect(`${BASE}/${newId}${buildQuery({ ok: "Boletim criado." })}`);
}
