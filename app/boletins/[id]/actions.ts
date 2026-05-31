"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getString, buildQuery, shortError } from "@/lib/cadastros/helpers";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import {
  assertBulletinTransition,
  BULLETIN_EVENT_BY_TARGET,
  type BulletinStatus,
} from "@/lib/boletins/status";
import { archiveBulletinPdf as archiveBulletinPdfFile } from "@/lib/pdf/archive";

function base(id: string): string {
  return `/boletins/${id}`;
}

type BulletinRow = { id: string; status: string; start_date: string; end_date: string };

/** Confere perfil admin-like e carrega o boletim. Lança Error em problema. */
async function loadGuarded(bulletinId: string) {
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    throw new Error("Apenas a Coordenação pode gerenciar boletins.");
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada.");

  const { data: bulletin, error } = await supabase
    .from("bulletins")
    .select("id, status, start_date, end_date")
    .eq("id", bulletinId)
    .maybeSingle();
  if (error) throw error;
  if (!bulletin) throw new Error("Boletim não encontrado.");

  return { supabase, user, bulletin: bulletin as BulletinRow };
}

function assertDraft(status: string) {
  if (status !== "rascunho") {
    throw new Error("Só é possível editar itens de um boletim em rascunho.");
  }
}

async function logBulletinEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  args: { bulletinId: string; to: BulletinStatus; note: string; createdBy: string },
) {
  const { error } = await supabase.from("bulletin_events").insert({
    bulletin_id: args.bulletinId,
    event_type: BULLETIN_EVENT_BY_TARGET[args.to] ?? args.to,
    note: args.note,
    created_by: args.createdBy,
  });
  if (error) throw error;
}

/**
 * Monta os itens do BI a partir de records validados+publicáveis+incluídos no período.
 * Idempotente: apaga TODOS os itens do BI e remonta do zero (só em rascunho).
 */
export async function assembleItems(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  let assembledCount = 0;
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);

    const { data, error } = await supabase.rpc("assemble_bulletin_items", {
      p_bulletin_id: id,
    });
    if (error) throw error;
    assembledCount = typeof data === "number" ? data : 0;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(
    `${base(id)}${buildQuery({
      ok: `${assembledCount} item(ns) montado(s) a partir dos registros validados.`,
    })}`,
  );
}

/** Alterna a visibilidade de um item (só em rascunho). */
export async function toggleItemVisible(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const next = getString(formData, "next", { required: true }) === "true";
    const { error } = await supabase
      .from("bulletin_items")
      .update({ visible: next })
      .eq("id", itemId)
      .eq("bulletin_id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Visibilidade alterada." })}`);
}

/**
 * Reordena um item para cima/baixo dentro da MESMA parte (troca display_order
 * com o vizinho). direction = "up" | "down".
 */
export async function reorderItem(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  let atLimit = false;
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const direction = getString(formData, "direction", { required: true });

    const { data: item, error: e1 } = await supabase
      .from("bulletin_items")
      .select("id, part_number, display_order")
      .eq("id", itemId)
      .eq("bulletin_id", id)
      .maybeSingle();
    if (e1) throw e1;
    if (!item) throw new Error("Item não encontrado.");

    let q = supabase
      .from("bulletin_items")
      .select("id, display_order")
      .eq("bulletin_id", id)
      .eq("part_number", item.part_number);
    q = direction === "up"
      ? q.lt("display_order", item.display_order).order("display_order", { ascending: false })
      : q.gt("display_order", item.display_order).order("display_order", { ascending: true });
    const { data: neighbors, error: e2 } = await q.limit(1);
    if (e2) throw e2;
    const neighbor = (neighbors ?? [])[0];

    if (!neighbor) {
      atLimit = true;
    } else {
      const { error: u1 } = await supabase
        .from("bulletin_items")
        .update({ display_order: neighbor.display_order })
        .eq("id", item.id);
      if (u1) throw u1;
      const { error: u2 } = await supabase
        .from("bulletin_items")
        .update({ display_order: item.display_order })
        .eq("id", neighbor.id);
      if (u2) throw u2;
    }
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(
    `${base(id)}${buildQuery({ ok: atLimit ? "Item já está no limite." : "Ordem alterada." })}`,
  );
}

/** Edita título/conteúdo de um item (só em rascunho). */
export async function updateItemContent(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, bulletin } = await loadGuarded(id);
    assertDraft(bulletin.status);
    const itemId = getString(formData, "item_id", { required: true });
    const title = getString(formData, "title");
    const content = getString(formData, "content");
    const { error } = await supabase
      .from("bulletin_items")
      .update({ title, content })
      .eq("id", itemId)
      .eq("bulletin_id", id);
    if (error) throw error;
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Item atualizado." })}`);
}

/** rascunho → aprovado (congela). Exige ≥1 item visível. */
export async function approveBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "aprovado");

    const { count, error: cErr } = await supabase
      .from("bulletin_items")
      .select("id", { count: "exact", head: true })
      .eq("bulletin_id", id)
      .eq("visible", true);
    if (cErr) throw cErr;
    if (!count || count === 0) {
      throw new Error("O boletim precisa de ao menos um item visível para ser aprovado.");
    }

    const { error } = await supabase
      .from("bulletins")
      .update({
        status: "aprovado",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "aprovado",
      note: "Boletim aprovado e congelado.",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim aprovado." })}`);
}

/** aprovado → rascunho (reabertura controlada, motivo obrigatório). */
export async function reopenBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "rascunho");
    const note = getString(formData, "note", { required: true });

    const { error } = await supabase
      .from("bulletins")
      .update({ status: "rascunho", approved_by: null, approved_at: null })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "rascunho",
      note,
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim reaberto para edição." })}`);
}

/** → cancelado. */
export async function cancelBulletin(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    assertBulletinTransition(bulletin.status, "cancelado");
    const { error } = await supabase
      .from("bulletins")
      .update({ status: "cancelado" })
      .eq("id", id);
    if (error) throw error;

    await logBulletinEvent(supabase, {
      bulletinId: id,
      to: "cancelado",
      note: "Boletim cancelado.",
      createdBy: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "Boletim cancelado." })}`);
}

/** Gera e salva o PDF aprovado no Storage privado. */
export async function archiveBulletinPdf(formData: FormData) {
  const id = getString(formData, "id", { required: true });
  try {
    const { supabase, user, bulletin } = await loadGuarded(id);
    if (bulletin.status !== "aprovado") {
      throw new Error("Apenas boletins aprovados podem ser arquivados em PDF.");
    }

    await archiveBulletinPdfFile({
      supabase,
      bulletinId: id,
      userId: user.id,
    });
  } catch (e) {
    redirect(`${base(id)}${buildQuery({ err: shortError(e) })}`);
  }
  revalidatePath(base(id));
  redirect(`${base(id)}${buildQuery({ ok: "PDF arquivado." })}`);
}
