import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import { PDF_BUCKET } from "@/lib/pdf/archive";

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
  if (!isAdminLike(profile) && profile !== "Consulta") {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 403 });
  }

  const { data: bulletin, error: bulletinError } = await supabase
    .from("bulletins")
    .select("pdf_path")
    .eq("id", id)
    .eq("status", "aprovado")
    .maybeSingle<{ pdf_path: string | null }>();
  if (bulletinError) {
    return NextResponse.json({ error: bulletinError.message }, { status: 500 });
  }
  if (!bulletin?.pdf_path) {
    return NextResponse.json({ error: "PDF arquivado não encontrado." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .download(bulletin.pdf_path);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${bulletin.pdf_path.split("/").pop()}"`,
      "Cache-Control": "no-store",
    },
  });
}
