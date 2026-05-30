import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { BULLETIN_PARTS } from "@/lib/records/options";
import { approveBulletin } from "../actions";

type Bulletin = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
};

type Item = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
};

export default async function BulletinPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: bRaw } = await supabase
    .from("bulletins")
    .select("id, number, year, publication_date, start_date, end_date, type, status")
    .eq("id", id)
    .maybeSingle();
  if (!bRaw) notFound();
  const b = bRaw as Bulletin;

  // Lê SOMENTE itens visíveis (DT-003/DT-006). Nenhum acesso a records aqui.
  const { data: itemsRaw } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order")
    .eq("bulletin_id", id)
    .eq("visible", true)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true });
  const items = (itemsRaw ?? []) as Item[];

  const periodo =
    b.start_date + (b.start_date !== b.end_date ? ` a ${b.end_date}` : "");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={`/boletins/${b.id}`} className="text-sm text-gray-600 hover:text-gray-900">
          ← Gestão
        </Link>
        {b.status === "rascunho" && (
          <form action={approveBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton>Aprovar para PDF</SubmitButton>
          </form>
        )}
      </div>

      {/* Documento A4-like */}
      <article className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
        <header className="border-b border-gray-300 pb-4 text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide text-gray-900">
            Academia Bombeiro Militar — CBMAP
          </h1>
          <p className="text-sm uppercase tracking-wide text-gray-700">
            Curso de Formação de Oficiais — Boletim Interno
          </p>
          <p className="mt-2 text-sm text-gray-900">
            <strong>BI nº {b.number}/{b.year}</strong> · {b.type}
          </p>
          <p className="text-sm text-gray-700">
            Período: {periodo}
            {b.publication_date ? ` · Publicação: ${b.publication_date}` : ""}
          </p>
        </header>

        {BULLETIN_PARTS.map((p) => {
          const part = Number(p.value);
          const partItems = items.filter((it) => it.part_number === part);
          return (
            <section key={p.value} className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                {p.label}
              </h2>
              {partItems.length === 0 ? (
                <p className="mt-2 text-sm italic text-gray-500">Sem alteração.</p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {partItems.map((it) => (
                    <li key={it.id} className="text-sm text-gray-900">
                      {it.title && <div className="font-semibold">{it.title}</div>}
                      <div className="whitespace-pre-wrap leading-relaxed">{it.content}</div>
                      {it.reference_date && (
                        <div className="mt-0.5 font-mono text-xs text-gray-500">
                          {it.reference_date}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        <footer className="mt-10 border-t border-gray-300 pt-3 text-center text-xs text-gray-500">
          Documento gerado pelo BI-CFO · Prévia (status: {b.status})
        </footer>
      </article>
    </div>
  );
}
