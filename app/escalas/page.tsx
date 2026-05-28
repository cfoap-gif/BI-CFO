import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField, TextAreaField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertScale, setScaleStatus } from "./actions";

type Scale = {
  id: string;
  date: string;
  scale_type: string;
  function_name: string;
  student_id: string | null;
  military_staff_id: string | null;
  platoon_id: string | null;
  start_time: string | null;
  end_time: string | null;
  location_id: string | null;
  uniform: string;
  notes: string;
  status: string;
  publish_suggestion: boolean;
  student:
    | { full_name: string; war_name: string; student_number: number }
    | { full_name: string; war_name: string; student_number: number }[]
    | null;
  military:
    | { full_name: string; war_name: string | null; rank: string | null }
    | { full_name: string; war_name: string | null; rank: string | null }[]
    | null;
  location: { name: string } | { name: string }[] | null;
  platoon: { name: string } | { name: string }[] | null;
};

type Student = { id: string; student_number: number; full_name: string; war_name: string };
type Military = { id: string; rank: string | null; full_name: string; war_name: string | null };
type Platoon = { id: string; name: string };
type Location = { id: string; name: string };

const SCALE_TYPES = [
  { value: "Aluno de Dia ao Corpo de Alunos", label: "Aluno de Dia ao Corpo de Alunos" },
  { value: "Aluno de Dia ao Pelotão", label: "Aluno de Dia ao Pelotão" },
  { value: "Permanência", label: "Permanência" },
  { value: "Apoio interno", label: "Apoio interno" },
  { value: "Apoio à instrução", label: "Apoio à instrução" },
  { value: "Missão interna", label: "Missão interna" },
  { value: "Missão externa", label: "Missão externa" },
  { value: "Militar de serviço", label: "Militar de serviço" },
  { value: "Outro", label: "Outro" },
];

const PERSON_KIND = [
  { value: "student", label: "Aluno" },
  { value: "military", label: "Militar" },
];

const NEXT_STATUS: Record<string, { label: string; to: string }[]> = {
  rascunho: [
    { label: "Validar", to: "validada" },
    { label: "Cancelar", to: "cancelada" },
  ],
  validada: [
    { label: "Marcar alterada", to: "alterada" },
    { label: "Publicar", to: "publicada" },
    { label: "Cancelar", to: "cancelada" },
  ],
  alterada: [
    { label: "Validar", to: "validada" },
    { label: "Cancelar", to: "cancelada" },
  ],
  publicada: [{ label: "Marcar alterada", to: "alterada" }],
  cancelada: [{ label: "Reabrir (rascunho)", to: "rascunho" }],
};

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function personLabel(s: Scale): string {
  const stu = pickOne(s.student);
  if (stu) return `Aluno #${stu.student_number} — ${stu.war_name}`;
  const mil = pickOne(s.military);
  if (mil) {
    const head = mil.rank ? `${mil.rank} ` : "";
    return `${head}${mil.war_name ?? mil.full_name}`;
  }
  return "—";
}

function statusBadge(s: string): React.ReactNode {
  const map: Record<string, string> = {
    rascunho: "bg-gray-100 text-gray-700 ring-gray-200",
    validada: "bg-blue-50 text-blue-700 ring-blue-200",
    alterada: "bg-amber-50 text-amber-700 ring-amber-200",
    publicada: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cancelada: "bg-red-50 text-red-700 ring-red-200",
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

type SearchParams = Promise<{
  edit?: string;
  ok?: string;
  err?: string;
  date?: string;
}>;

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err, date: dateFilter } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const today = new Date().toISOString().slice(0, 10);
  const effectiveDate = dateFilter ?? "";

  let query = supabase
    .from("duty_scales")
    .select(
      `id, date, scale_type, function_name, student_id, military_staff_id, platoon_id,
       start_time, end_time, location_id, uniform, notes, status, publish_suggestion,
       student:students(full_name, war_name, student_number),
       military:military_staff(full_name, war_name, rank),
       location:locations(name),
       platoon:platoons(name)`,
    )
    .order("date", { ascending: false })
    .order("start_time", { ascending: true });
  if (effectiveDate) query = query.eq("date", effectiveDate);
  query = query.limit(200);

  const [{ data: rawScales }, { data: stuRaw }, { data: milRaw }, { data: locRaw }, { data: plaRaw }] =
    await Promise.all([
      query,
      supabase
        .from("students")
        .select("id, student_number, full_name, war_name")
        .eq("active", true)
        .order("student_number"),
      supabase
        .from("military_staff")
        .select("id, rank, full_name, war_name")
        .eq("active", true)
        .order("full_name"),
      supabase
        .from("locations")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("platoons")
        .select("id, name")
        .eq("active", true)
        .order("name"),
    ]);

  const scales = (rawScales ?? []) as unknown as Scale[];
  const students = (stuRaw ?? []) as Student[];
  const militaries = (milRaw ?? []) as Military[];
  const locations = (locRaw ?? []) as Location[];
  const platoons = (plaRaw ?? []) as Platoon[];

  const editing = edit ? scales.find((s) => s.id === edit) : undefined;

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `#${s.student_number} ${s.war_name} — ${s.full_name}`,
  }));
  const militaryOptions = militaries.map((m) => ({
    value: m.id,
    label: [m.rank, m.war_name ?? m.full_name].filter(Boolean).join(" "),
  }));
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name }));
  const platoonOptions = platoons.map((p) => ({ value: p.id, label: p.name }));

  const editingPersonKind: string = editing?.student_id ? "student" : editing?.military_staff_id ? "military" : "";
  const editingPersonId = editing?.student_id ?? editing?.military_staff_id ?? "";

  const canCreate = studentOptions.length + militaryOptions.length > 0;

  return (
    <div>
      <PageHeader title="Escalas" description="Escalas de serviço do CFO.">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <TextField
          label="Filtrar por data"
          name="date"
          type="text"
          placeholder="YYYY-MM-DD"
          defaultValue={effectiveDate || undefined}
          hint={`Hoje: ${today}. Deixe em branco para todas.`}
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Filtrar
        </button>
        {effectiveDate && (
          <Link
            href="/escalas"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Limpar
          </Link>
        )}
      </form>

      <div className="mb-6 mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {editing ? "Editar escala" : "Nova escala"}
        </h3>
        {!canCreate ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Cadastre pelo menos um aluno ou militar ativo antes de criar escalas.
          </p>
        ) : (
          <form action={upsertScale} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <TextField
              label="Data"
              name="date"
              type="text"
              required
              placeholder="YYYY-MM-DD"
              defaultValue={editing?.date ?? today}
            />
            <SelectField
              label="Tipo de escala"
              name="scale_type"
              required
              options={SCALE_TYPES}
              defaultValue={editing?.scale_type ?? ""}
            />
            <TextField
              label="Função"
              name="function_name"
              defaultValue={editing?.function_name}
              placeholder="ex.: Comandante de Guarda"
              className="sm:col-span-2"
            />
            <SelectField
              label="Tipo de pessoa"
              name="person_kind"
              required
              options={PERSON_KIND}
              defaultValue={editingPersonKind}
            />
            <SelectField
              label="Pessoa (Aluno OU Militar)"
              name="person_id"
              required
              options={[...studentOptions, ...militaryOptions]}
              defaultValue={editingPersonId}
              hint="O tipo de pessoa acima determina como o ID será gravado."
            />
            <TextField
              label="Início"
              name="start_time"
              type="text"
              placeholder="HH:MM"
              defaultValue={editing?.start_time ?? undefined}
            />
            <TextField
              label="Fim"
              name="end_time"
              type="text"
              placeholder="HH:MM"
              defaultValue={editing?.end_time ?? undefined}
            />
            <SelectField
              label="Local"
              name="location_id"
              options={locationOptions}
              defaultValue={editing?.location_id ?? ""}
            />
            <SelectField
              label="Pelotão"
              name="platoon_id"
              options={platoonOptions}
              defaultValue={editing?.platoon_id ?? ""}
            />
            <TextField
              label="Uniforme"
              name="uniform"
              defaultValue={editing?.uniform}
              className="sm:col-span-2"
            />
            <TextAreaField
              label="Observações"
              name="notes"
              defaultValue={editing?.notes}
              className="sm:col-span-2"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
              <input
                type="checkbox"
                name="publish_suggestion"
                defaultChecked={editing?.publish_suggestion}
                className="h-4 w-4 rounded border-gray-300"
              />
              Sugerir publicação no BI (3ª Parte)
            </label>
            <div className="flex gap-2 pt-2 sm:col-span-2">
              <SubmitButton>
                {editing ? "Salvar alterações" : "Criar escala"}
              </SubmitButton>
              {editing && (
                <Link
                  href="/escalas"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Função</th>
              <th className="px-4 py-3">Pessoa</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3">Local</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {scales.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma escala {effectiveDate ? `para ${effectiveDate}` : ""}.
                </td>
              </tr>
            )}
            {scales.map((s) => {
              const loc = pickOne(s.location);
              return (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-gray-700">{s.date}</td>
                  <td className="px-4 py-3 text-gray-700">{s.scale_type}</td>
                  <td className="px-4 py-3 text-gray-700">{s.function_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-900">{personLabel(s)}</td>
                  <td className="px-4 py-3 font-mono text-gray-700">
                    {s.start_time && s.end_time
                      ? `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}`
                      : s.start_time
                        ? s.start_time.slice(0, 5)
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{loc?.name ?? "—"}</td>
                  <td className="px-4 py-3">{statusBadge(s.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/escalas?edit=${s.id}`}
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        Editar
                      </Link>
                      {(NEXT_STATUS[s.status] ?? []).map((t) => (
                        <form action={setScaleStatus} key={t.to}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="status" value={t.to} />
                          <button
                            type="submit"
                            className="text-sm font-medium text-gray-700 hover:underline"
                          >
                            {t.label}
                          </button>
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
