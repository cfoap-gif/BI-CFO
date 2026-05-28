import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { createDailyBook } from "./actions";

type DailyBook = {
  id: string;
  date: string;
  course_label: string;
  status: string;
  expected_effective: number | null;
  present_effective: number | null;
  duty_student:
    | { war_name: string; student_number: number }
    | { war_name: string; student_number: number }[]
    | null;
};

type Student = { id: string; student_number: number; war_name: string };

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function dutyLabel(b: DailyBook): string {
  const s = pickOne(b.duty_student);
  if (!s) return "—";
  return `#${s.student_number} ${s.war_name}`;
}

function statusBadge(s: string): React.ReactNode {
  const map: Record<string, string> = {
    rascunho: "bg-gray-100 text-gray-700 ring-gray-200",
    enviado: "bg-blue-50 text-blue-700 ring-blue-200",
    "em revisão": "bg-amber-50 text-amber-700 ring-amber-200",
    "pendente de correção": "bg-orange-50 text-orange-700 ring-orange-200",
    validado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    arquivado: "bg-gray-100 text-gray-500 ring-gray-200",
  };
  const cls = map[s] ?? map.rascunho;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {s}
    </span>
  );
}

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function LivroDeDiaListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: booksRaw }, { data: stuRaw }] = await Promise.all([
    supabase
      .from("daily_books")
      .select(
        `id, date, course_label, status, expected_effective, present_effective,
         duty_student:students!daily_books_student_duty_ca_id_fkey(war_name, student_number)`,
      )
      .order("date", { ascending: false })
      .limit(100),
    supabase
      .from("students")
      .select("id, student_number, war_name")
      .eq("active", true)
      .order("student_number"),
  ]);

  const books = (booksRaw ?? []) as unknown as DailyBook[];
  const students = (stuRaw ?? []) as Student[];

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `#${s.student_number} ${s.war_name}`,
  }));

  return (
    <div>
      <PageHeader
        title="Livro de Dia"
        description="Registro diário da rotina do CFO."
      >
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Abrir novo Livro de Dia
        </h3>
        <form
          action={createDailyBook}
          className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <TextField
            label="Data"
            name="date"
            type="text"
            required
            placeholder="YYYY-MM-DD"
            defaultValue={today}
          />
          <TextField
            label="Curso/Turma"
            name="course_label"
            defaultValue="Geral"
            hint="Use 'Geral' se o CFO tem turma única."
          />
          <SelectField
            label="Aluno de Dia ao Corpo de Alunos"
            name="student_duty_ca_id"
            options={studentOptions}
            hint="Pode ser preenchido depois."
          />
          <div className="sm:col-span-3">
            <SubmitButton>Abrir Livro de Dia</SubmitButton>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Aluno de Dia (CA)</th>
              <th className="px-4 py-3">Efetivo prev / pres</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Abrir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {books.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Nenhum Livro de Dia ainda.
                </td>
              </tr>
            )}
            {books.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 font-mono text-gray-900">{b.date}</td>
                <td className="px-4 py-3 text-gray-700">{b.course_label}</td>
                <td className="px-4 py-3 text-gray-700">{dutyLabel(b)}</td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {b.expected_effective ?? "—"} / {b.present_effective ?? "—"}
                </td>
                <td className="px-4 py-3">{statusBadge(b.status)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/livro-de-dia/${b.id}`}
                    className="text-sm font-medium text-gray-700 hover:underline"
                  >
                    Abrir →
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
