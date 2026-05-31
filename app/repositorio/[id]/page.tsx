import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";
import { PageHeader } from "@/components/admin/PageHeader";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { BULLETIN_PARTS } from "@/lib/records/options";

type Bulletin = {
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
  pdf_path: string | null;
  pdf_generated_at: string | null;
};

type Item = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
};

export default async function RepositorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfileName();
  const canGeneratePdf = isAdminLike(profile);

  const { data: bRaw } = await supabase
    .from("bulletins")
    .select(
      `id, number, year, publication_date, start_date, end_date, type, status,
       version, approved_at, pdf_path, pdf_generated_at`,
    )
    .eq("id", id)
    .eq("status", "aprovado")
    .maybeSingle();
  if (!bRaw) notFound();
  const b = bRaw as Bulletin;

  const { data: itemRows } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order")
    .eq("bulletin_id", id)
    .eq("visible", true)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true });
  const items = (itemRows ?? []) as Item[];

  const periodo =
    b.start_date + (b.start_date !== b.end_date ? ` — ${b.end_date}` : "");

  return (
    <div>
      <PageHeader
        title={`BI ${b.number}/${b.year}`}
        description={`${b.type} · ${periodo}`}
      >
        <Link href="/repositorio" className="text-sm text-gray-600 hover:text-gray-900">
          ← Repositório
        </Link>
        {canGeneratePdf && (
          <Link
            href={`/boletins/${b.id}/pdf`}
            className="text-sm font-medium text-slate-900 hover:underline"
          >
            Baixar PDF
          </Link>
        )}
        {b.pdf_path && (
          <Link
            href={`/repositorio/${b.id}/arquivo`}
            className="text-sm font-medium text-slate-900 hover:underline"
          >
            Baixar arquivado
          </Link>
        )}
      </PageHeader>

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
            <div className="mt-1">
              <BulletinStatusBadge status={b.status} />
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Versão</div>
            <div className="mt-1 font-medium text-gray-900">v{b.version}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Publicação
            </div>
            <div className="mt-1 font-mono text-gray-900">
              {b.publication_date ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              PDF arquivado
            </div>
            <div className="mt-1 text-gray-900">
              {b.pdf_generated_at
                ? new Date(b.pdf_generated_at).toLocaleString("pt-BR")
                : "Não arquivado"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Aprovação
            </div>
            <div className="mt-1 text-gray-900">
              {b.approved_at ? new Date(b.approved_at).toLocaleString("pt-BR") : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {BULLETIN_PARTS.map((part) => {
          const partNumber = Number(part.value);
          const partItems = items.filter((item) => item.part_number === partNumber);

          return (
            <section
              key={part.value}
              className="rounded-xl border border-gray-200 bg-white p-6"
            >
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                {part.label}
              </h3>
              {partItems.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Sem alteração.</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {partItems.map((item) => (
                    <li key={item.id} className="border-l-2 border-gray-200 pl-3">
                      <div className="font-mono text-xs text-gray-500">
                        {item.reference_date ?? "—"}
                      </div>
                      {item.title && (
                        <div className="mt-1 font-medium text-gray-900">
                          {item.title}
                        </div>
                      )}
                      <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {item.content}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
