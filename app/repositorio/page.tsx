import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { normalizeRepositoryFilters } from "@/lib/boletins/repository-filters";

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
  pdf_path: string | null;
  pdf_generated_at: string | null;
};

type SearchParams = Promise<{
  q?: string;
  year?: string;
  number?: string;
  start?: string;
  end?: string;
}>;

export default async function RepositorioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawFilters = await searchParams;
  const filters = normalizeRepositoryFilters(rawFilters);
  const supabase = await createSupabaseServerClient();
  let matchingBulletinIds: string[] | null = null;

  if (filters.q) {
    const pattern = `%${filters.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    const { data: itemRows } = await supabase
      .from("bulletin_items")
      .select("bulletin_id")
      .eq("visible", true)
      .or(`title.ilike.${pattern},content.ilike.${pattern}`);
    matchingBulletinIds = Array.from(
      new Set(((itemRows ?? []) as { bulletin_id: string }[]).map((row) => row.bulletin_id)),
    );
  }

  let query = supabase
    .from("bulletins")
    .select(
      `id, number, year, publication_date, start_date, end_date, type, status,
       version, pdf_path, pdf_generated_at`,
    )
    .eq("status", "aprovado")
    .order("year", { ascending: false })
    .order("number", { ascending: false });

  if (filters.year !== undefined) query = query.eq("year", filters.year);
  if (filters.number !== undefined) query = query.eq("number", filters.number);
  if (filters.start) query = query.gte("end_date", filters.start);
  if (filters.end) query = query.lte("start_date", filters.end);
  if (matchingBulletinIds) {
    query = matchingBulletinIds.length > 0
      ? query.in("id", matchingBulletinIds)
      : query.eq("id", "00000000-0000-0000-0000-000000000000");
  }

  const { data } = await query;
  const bulletins = (data ?? []) as Bulletin[];

  return (
    <div>
      <PageHeader
        title="Repositório documental"
        description="Consulta e download de Boletins Internos aprovados."
      >
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <form
        method="get"
        className="mb-4 mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label htmlFor="q" className="block text-xs font-medium text-slate-700">
            Busca
          </label>
          <input
            id="q"
            name="q"
            type="text"
            placeholder="Aluno, missão ou termo do BI"
            defaultValue={rawFilters.q ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-xs font-medium text-slate-700">
            Ano
          </label>
          <input
            id="year"
            name="year"
            type="number"
            min={2000}
            max={2099}
            defaultValue={rawFilters.year ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="number" className="block text-xs font-medium text-slate-700">
            Número
          </label>
          <input
            id="number"
            name="number"
            type="number"
            min={1}
            defaultValue={rawFilters.number ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="start" className="block text-xs font-medium text-slate-700">
            Período inicial
          </label>
          <input
            id="start"
            name="start"
            type="text"
            placeholder="YYYY-MM-DD"
            defaultValue={rawFilters.start ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="end" className="block text-xs font-medium text-slate-700">
            Período final
          </label>
          <input
            id="end"
            name="end"
            type="text"
            placeholder="YYYY-MM-DD"
            defaultValue={rawFilters.end ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Filtrar
          </button>
          <Link
            href="/repositorio"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nº / Ano</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Publicação</th>
              <th className="px-4 py-3">Versão</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Arquivo</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bulletins.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhum boletim aprovado encontrado.
                </td>
              </tr>
            )}
            {bulletins.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {b.number}/{b.year}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.start_date}
                  {b.start_date !== b.end_date ? ` — ${b.end_date}` : ""}
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.publication_date ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-700">v{b.version}</td>
                <td className="px-4 py-3">
                  <BulletinStatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {b.pdf_generated_at
                    ? new Date(b.pdf_generated_at).toLocaleString("pt-BR")
                    : "Não arquivado"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/repositorio/${b.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      Abrir
                    </Link>
                    {b.pdf_path ? (
                      <Link
                        href={`/repositorio/${b.id}/arquivo`}
                        className="text-sm font-medium text-slate-900 hover:underline"
                      >
                        Baixar
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">Sem PDF</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
