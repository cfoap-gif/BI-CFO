import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField } from "@/components/admin/Field";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { createBulletin } from "./actions";

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

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function BoletinsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("bulletins")
    .select("id, number, year, publication_date, start_date, end_date, type, status")
    .order("year", { ascending: false })
    .order("number", { ascending: false });
  const bulletins = (data ?? []) as Bulletin[];

  const currentYear = new Date().getFullYear();

  return (
    <div>
      <PageHeader title="Boletins Internos" description="Criação e publicação dos BIs.">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Novo boletim
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          O tipo (diário/período) é derivado das datas: iguais = diário, diferentes = período.
        </p>
        <form
          action={createBulletin}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <TextField label="Número" name="number" type="number" min={1} required />
          <TextField
            label="Ano"
            name="year"
            type="number"
            min={2000}
            max={2099}
            defaultValue={currentYear}
            required
          />
          <TextField label="Data de publicação" name="publication_date" type="text" placeholder="YYYY-MM-DD" />
          <div />
          <TextField label="Data inicial" name="start_date" type="text" required placeholder="YYYY-MM-DD" />
          <TextField label="Data final" name="end_date" type="text" required placeholder="YYYY-MM-DD" />
          <div className="sm:col-span-2">
            <SubmitButton>Criar boletim</SubmitButton>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nº / Ano</th>
              <th className="px-4 py-3">Período</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Publicação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bulletins.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhum boletim criado.
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
                <td className="px-4 py-3 text-gray-700">{b.type}</td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.publication_date ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <BulletinStatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/boletins/${b.id}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    Abrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
