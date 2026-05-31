import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BulletinPdfError,
  type BulletinPdfData,
  type BulletinPdfItem,
} from "./types";

type BulletinRow = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  version: number;
  approved_at: string | null;
};

type BulletinItemRow = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
};

export async function loadBulletinPdfData(
  supabase: SupabaseClient,
  bulletinId: string,
): Promise<BulletinPdfData> {
  const { data: bulletin, error: bulletinError } = await supabase
    .from("bulletins")
    .select(
      "id, number, year, publication_date, start_date, end_date, type, status, version, approved_at",
    )
    .eq("id", bulletinId)
    .maybeSingle<BulletinRow>();

  if (bulletinError) {
    throw new BulletinPdfError("load_failed", bulletinError.message);
  }
  if (!bulletin) {
    throw new BulletinPdfError("not_found", "Boletim não encontrado.");
  }
  if (bulletin.status !== "aprovado") {
    throw new BulletinPdfError(
      "not_approved",
      "O PDF só pode ser gerado para boletim aprovado.",
    );
  }

  const { data: itemRows, error: itemsError } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order")
    .eq("bulletin_id", bulletinId)
    .eq("visible", true)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true })
    .order("reference_date", { ascending: true });

  if (itemsError) {
    throw new BulletinPdfError("load_failed", itemsError.message);
  }

  const items: BulletinPdfItem[] = ((itemRows ?? []) as BulletinItemRow[]).map(
    (item) => ({
      id: item.id,
      partNumber: item.part_number,
      referenceDate: item.reference_date,
      title: item.title,
      content: item.content,
      displayOrder: item.display_order,
    }),
  );

  return {
    id: bulletin.id,
    number: bulletin.number,
    year: bulletin.year,
    publicationDate: bulletin.publication_date,
    startDate: bulletin.start_date,
    endDate: bulletin.end_date,
    type: bulletin.type,
    status: bulletin.status,
    version: bulletin.version,
    approvedAt: bulletin.approved_at,
    items,
  };
}
