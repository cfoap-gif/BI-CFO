import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertDiscipline, toggleDisciplineActive } from "./actions";

type Discipline = {
  id: string;
  name: string;
  cfo_year: number | null;
  workload_hours: number;
  discipline_type: string;
  main_instructor_id: string | null;
  active: boolean;
  main_instructor:
    | { full_name: string; war_name: string | null }
    | { full_name: string; war_name: string | null }[]
    | null;
};

function instructorLabel(m: Discipline["main_instructor"]): string {
  if (!m) return "—";
  const row = Array.isArray(m) ? m[0] : m;
  if (!row) return "—";
  return row.war_name ?? row.full_name;
}

type Instructor = { id: string; full_name: string; war_name: string | null };

const TYPES = [
  { value: "teórica", label: "Teórica" },
  { value: "prática", label: "Prática" },
  { value: "mista", label: "Mista" },
  { value: "estágio", label: "Estágio" },
  { value: "atividade complementar", label: "Atividade complementar" },
];

type SearchParams = Promise<{ edit?: string; ok?: string; err?: string }>;

export default async function DisciplinasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: disciplinesRaw }, { data: instructorsRaw }] = await Promise.all([
    supabase
      .from("disciplines")
      .select(
        "id, name, cfo_year, workload_hours, discipline_type, main_instructor_id, active, main_instructor:military_staff(full_name, war_name)",
      )
      .order("name"),
    supabase
      .from("military_staff")
      .select("id, full_name, war_name")
      .eq("active", true)
      .in("staff_type", ["instrutor", "coordenação", "monitor", "outro"])
      .order("full_name"),
  ]);

  const disciplines = (disciplinesRaw ?? []) as unknown as Discipline[];
  const instructors = (instructorsRaw ?? []) as Instructor[];
  const editing = edit ? disciplines.find((d) => d.id === edit) : undefined;

  const instructorOptions = instructors.map((i) => ({
    value: i.id,
    label: i.war_name ? `${i.war_name} — ${i.full_name}` : i.full_name,
  }));

  return (
    <div>
      <PageHeader title="Disciplinas" description="Disciplinas do CFO.">
        <Link
          href="/cadastros"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Cadastros
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {editing ? "Editar disciplina" : "Nova disciplina"}
        </h3>
        <form action={upsertDiscipline} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <TextField
            label="Nome"
            name="name"
            required
            defaultValue={editing?.name}
            className="sm:col-span-2"
          />
          <TextField
            label="Ano do CFO"
            name="cfo_year"
            type="number"
            min={2000}
            max={2099}
            defaultValue={editing?.cfo_year ?? undefined}
          />
          <TextField
            label="Carga horária"
            name="workload_hours"
            type="number"
            min={0}
            max={5000}
            defaultValue={editing?.workload_hours ?? 0}
          />
          <SelectField
            label="Tipo"
            name="discipline_type"
            required
            options={TYPES}
            defaultValue={editing?.discipline_type ?? "teórica"}
          />
          <SelectField
            label="Instrutor principal"
            name="main_instructor_id"
            options={instructorOptions}
            defaultValue={editing?.main_instructor_id ?? ""}
            hint={instructorOptions.length === 0 ? "Cadastre um militar ativo do tipo instrutor primeiro." : undefined}
          />
          <div className="flex gap-2 pt-2 sm:col-span-2">
            <SubmitButton>
              {editing ? "Salvar alterações" : "Criar disciplina"}
            </SubmitButton>
            {editing && (
              <Link
                href="/cadastros/disciplinas"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </Link>
            )}
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Ano</th>
              <th className="px-4 py-3">CH</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Instrutor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {disciplines.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma disciplina cadastrada.
                </td>
              </tr>
            )}
            {disciplines.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                <td className="px-4 py-3 text-gray-700">{d.cfo_year ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{d.workload_hours}</td>
                <td className="px-4 py-3 text-gray-700">{d.discipline_type}</td>
                <td className="px-4 py-3 text-gray-700">
                  {instructorLabel(d.main_instructor)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge active={d.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cadastros/disciplinas?edit=${d.id}`}
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleDisciplineActive}>
                      <input type="hidden" name="id" value={d.id} />
                      <input type="hidden" name="next" value={String(!d.active)} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        {d.active ? "Desativar" : "Ativar"}
                      </button>
                    </form>
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
