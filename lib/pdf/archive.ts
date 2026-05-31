import { renderToBuffer } from "@react-pdf/renderer";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createElement } from "react";
import { buildBulletinArchivePath } from "./archive-path";
import { loadBulletinPdfData } from "./bulletin-data";
import { BulletinPdfDocument } from "./bulletin-document";

const PDF_BUCKET = "bulletins";

type ArchiveBulletinPdfArgs = {
  supabase: SupabaseClient;
  bulletinId: string;
  userId: string;
  generatedAt?: Date;
};

export async function archiveBulletinPdf({
  supabase,
  bulletinId,
  userId,
  generatedAt = new Date(),
}: ArchiveBulletinPdfArgs): Promise<{ path: string }> {
  const data = await loadBulletinPdfData(supabase, bulletinId);
  const document = createElement(BulletinPdfDocument, { data, generatedAt });
  const buffer = await renderToBuffer(
    document as Parameters<typeof renderToBuffer>[0],
  );
  const path = buildBulletinArchivePath({
    number: data.number,
    year: data.year,
    startDate: data.startDate,
    endDate: data.endDate,
    version: data.version,
  });

  const { error: uploadError } = await supabase.storage
    .from(PDF_BUCKET)
    .upload(path, new Uint8Array(buffer), {
      contentType: "application/pdf",
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("bulletins")
    .update({
      pdf_path: path,
      pdf_generated_at: generatedAt.toISOString(),
      pdf_generated_by: userId,
    })
    .eq("id", bulletinId);
  if (updateError) throw updateError;

  return { path };
}

export { PDF_BUCKET };
