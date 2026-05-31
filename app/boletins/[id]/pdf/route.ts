import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { createElement } from "react";
import { isAdminLike, getCurrentProfileName } from "@/lib/auth/profile";
import { buildBulletinPdfFilename } from "@/lib/pdf/filename";
import { loadBulletinPdfData } from "@/lib/pdf/bulletin-data";
import { BulletinPdfDocument } from "@/lib/pdf/bulletin-document";
import { BulletinPdfError } from "@/lib/pdf/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
  }

  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  try {
    const data = await loadBulletinPdfData(supabase, id);
    const generatedAt = new Date();
    const document = createElement(BulletinPdfDocument, { data, generatedAt });
    const buffer = await renderToBuffer(
      document as Parameters<typeof renderToBuffer>[0],
    );
    const filename = buildBulletinPdfFilename({
      number: data.number,
      year: data.year,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof BulletinPdfError) {
      const status =
        error.code === "not_found" ? 404 : error.code === "not_approved" ? 409 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(
      { error: "Não foi possível gerar o PDF." },
      { status: 500 },
    );
  }
}
