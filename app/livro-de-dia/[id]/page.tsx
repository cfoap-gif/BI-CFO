import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { SubmitButton } from "@/components/admin/SubmitButton";
import {
  TextField,
  SelectField,
  TextAreaField,
} from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import {
  updateDailyBookHeader,
  setDailyBookStatus,
  upsertRecord,
  cancelRecord,
} from "./actions";
import { BULLETIN_PARTS } from "@/lib/records/options";
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";

type DailyBook = {
  id: string;
  date: string;
  course_label: string;
  status: string;
  expected_effective: number | null;
  present_effective: number | null;
  general_summary: string;
  service_passage: string;
  student_duty_ca_id: string | null;
};

type Record = {
  id: string;
  record_type: string;
  reference_date: string;
  title: string;
  original_description: string;
  classification: string | null;
  status: string;
  bulletin_part: number | null;
  student_id: string | null;
  platoon_id: string | null;
  discipline_id: string | null;
  location_id: string | null;
  responsible_staff_id: string | null;
  student:
    | { war_name: string; student_number: number }
    | { war_name: string; student_number: number }[]
    | null;
  discipline: { name: string } | { name: string }[] | null;
};

type Student = { id: string; student_number: number; war_name: string };
type Platoon = { id: string; name: string };
type Discipline = { id: string; name: string };
type Location = { id: string; name: string };
type Staff = { id: string; rank: string | null; full_name: string; war_name: string | null };

const RECORD_TYPES = [
  { value: "falta", label: "Falta" },
  { value: "atraso", label: "Atraso" },
  { value: "baixa", label: "Baixa / atendimento de saúde" },
  { value: "dispensa", label: "Dispensa" },
  { value: "apresentação", label: "Apresentação" },
  { value: "reapresentação", label: "Reapresentação" },
  { value: "instrução ministrada", label: "Instrução ministrada" },
  { value: "alteração de material", label: "Alteração de material" },
  { value: "alteração de QTS", label: "Alteração de QTS" },
  { value: "missão interna", label: "Missão interna" },
  { value: "missão externa", label: "Missão externa" },
  { value: "ocorrência disciplinar", label: "Ocorrência disciplinar" },
  { value: "elogio", label: "Elogio" },
  { value: "recompensa", label: "Recompensa" },
  { value: "punição", label: "Punição" },
  { value: "aviso", label: "Aviso" },
  { value: "prescrição da Coordenação", label: "Prescrição da Coordenação" },
  { value: "outro", label: "Outro" },
];

const STATUS_FLOW: { [k: string]: { label: string; to: string }[] } = {
  rascunho: [{ label: "Enviar para revisão", to: "enviado" }],
  enviado: [
    { label: "Em revisão", to: "em revisão" },
    { label: "Devolver para correção", to: "pendente de correção" },
  ],
  "em revisão": [
    { label: "Devolver", to: "pendente de correção" },
    { label: "Validar", to: "validado" },
  ],
  "pendente de correção": [{ label: "Reenviar", to: "enviado" }],
  validado: [{ label: "Arquivar", to: "arquivado" }],
  arquivado: [],
};

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function studentLabel(r: Record): string {
  const s = pickOne(r.student);
  if (!s) return "—";
  return `#${s.student_number} ${s.war_name}`;
}

type SearchParams = Promise<{ editRec?: string; ok?: string; err?: string }>;

export default async function DailyBookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { editRec, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: book }, { data: stuRaw }, { data: plaRaw }, { data: disRaw }, { data: locRaw }, { data: staRaw }] =
    await Promise.all([
      supabase.from("daily_books").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("students")
        .select("id, student_number, war_name")
        .eq("active", true)
        .order("student_number"),
      supabase
        .from("platoons")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("disciplines")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("locations")
        .select("id, name")
        .eq("active", true)
        .order("name"),
      supabase
        .from("military_staff")
        .select("id, rank, full_name, war_name")
        .eq("active", true)
        .order("full_name"),
    ]);

  if (!book) notFound();
  const b = book as DailyBook;

  const { data: recsRaw } = await supabase
    .from("records")
    .select(
      `id, record_type, reference_date, title, original_description, classification,
       status, bulletin_part, student_id, platoon_id, discipline_id, location_id,
       responsible_staff_id,
       student:students(war_name, student_number),
       discipline:disciplines(name)`,
    )
    .eq("daily_book_id", id)
    .order("reference_date", { ascending: true })
    .order("created_at", { ascending: true });

  const records = (recsRaw ?? []) as unknown as Record[];
  const students = (stuRaw ?? []) as Student[];
  const platoons = (plaRaw ?? []) as Platoon[];
  const disciplines = (disRaw ?? []) as Discipline[];
  const locations = (locRaw ?? []) as Location[];
  const staff = (staRaw ?? []) as Staff[];

  const editingRec = editRec ? records.find((r) => r.id === editRec) : undefined;

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `#${s.student_number} ${s.war_name}`,
  }));
  const platoonOptions = platoons.map((p) => ({ value: p.id, label: p.name }));
  const disciplineOptions = disciplines.map((d) => ({ value: d.id, label: d.name }));
  const locationOptions = locations.map((l) => ({ value: l.id, label: l.name }));
  const staffOptions = staff.map((s) => ({
    value: s.id,
    label: [s.rank, s.war_name ?? s.full_name].filter(Boolean).join(" "),
  }));

  const editable = b.status === "rascunho" || b.status === "pendente de correção";
  const transitions = STATUS_FLOW[b.status] ?? [];

  return (
    <div>
      <PageHeader
        title={`Livro de Dia — ${b.date}`}
        description={`Curso: ${b.course_label}`}
      >
        <Link
          href="/livro-de-dia"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Lista
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      {/* Header form + status */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
            Cabeçalho do livro
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Status:</span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 ring-1 ring-inset ring-gray-200">
              {b.status}
            </span>
            {transitions.map((t) => (
              <form action={setDailyBookStatus} key={t.to}>
                <input type="hidden" name="id" value={b.id} />
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
        </div>

        <form
          action={updateDailyBookHeader}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <input type="hidden" name="id" value={b.id} />
          <SelectField
            label="Aluno de Dia (CA)"
            name="student_duty_ca_id"
            options={studentOptions}
            defaultValue={b.student_duty_ca_id ?? ""}
          />
          <div />
          <TextField
            label="Efetivo previsto"
            name="expected_effective"
            type="number"
            min={0}
            max={9999}
            defaultValue={b.expected_effective ?? undefined}
          />
          <TextField
            label="Efetivo presente"
            name="present_effective"
            type="number"
            min={0}
            max={9999}
            defaultValue={b.present_effective ?? undefined}
          />
          <TextAreaField
            label="Resumo geral"
            name="general_summary"
            defaultValue={b.general_summary}
            rows={3}
            className="sm:col-span-2"
          />
          <TextAreaField
            label="Passagem de serviço"
            name="service_passage"
            defaultValue={b.service_passage}
            rows={3}
            className="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <SubmitButton>Salvar cabeçalho</SubmitButton>
          </div>
        </form>
      </div>

      {/* Records */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          {editingRec ? "Editar registro" : "Novo registro"}
        </h3>
        {!editable && !editingRec ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Livro fora do estado editável. Reabra (status rascunho ou pendente de correção) para adicionar registros.
          </p>
        ) : (
          <form
            action={upsertRecord}
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <input type="hidden" name="daily_book_id" value={b.id} />
            {editingRec && <input type="hidden" name="id" value={editingRec.id} />}
            <SelectField
              label="Tipo de registro"
              name="record_type"
              required
              options={RECORD_TYPES}
              defaultValue={editingRec?.record_type ?? ""}
            />
            <TextField
              label="Data de referência"
              name="reference_date"
              type="text"
              required
              placeholder="YYYY-MM-DD"
              defaultValue={editingRec?.reference_date ?? b.date}
            />
            <TextField
              label="Título curto"
              name="title"
              defaultValue={editingRec?.title}
              className="sm:col-span-2"
            />
            <TextAreaField
              label="Descrição original"
              name="original_description"
              required
              defaultValue={editingRec?.original_description}
              rows={4}
              hint="Texto integral do fato. A Coordenação edita o texto publicável separadamente."
              className="sm:col-span-2"
            />
            <SelectField
              label="Aluno"
              name="student_id"
              options={studentOptions}
              defaultValue={editingRec?.student_id ?? ""}
            />
            <SelectField
              label="Pelotão"
              name="platoon_id"
              options={platoonOptions}
              defaultValue={editingRec?.platoon_id ?? ""}
            />
            <SelectField
              label="Disciplina"
              name="discipline_id"
              options={disciplineOptions}
              defaultValue={editingRec?.discipline_id ?? ""}
            />
            <SelectField
              label="Local"
              name="location_id"
              options={locationOptions}
              defaultValue={editingRec?.location_id ?? ""}
            />
            <SelectField
              label="Responsável (militar)"
              name="responsible_staff_id"
              options={staffOptions}
              defaultValue={editingRec?.responsible_staff_id ?? ""}
            />
            <SelectField
              label="Parte do BI (sugestão)"
              name="bulletin_part"
              options={BULLETIN_PARTS}
              defaultValue={
                editingRec?.bulletin_part != null
                  ? String(editingRec.bulletin_part)
                  : ""
              }
              hint="Decisão final é da Coordenação."
            />
            <div className="flex gap-2 pt-2 sm:col-span-2">
              <SubmitButton>
                {editingRec ? "Salvar alterações" : "Adicionar registro"}
              </SubmitButton>
              {editingRec && (
                <Link
                  href={`/livro-de-dia/${b.id}`}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Título / Descrição</th>
              <th className="px-4 py-3">Parte</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Sem registros neste livro.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {r.reference_date}
                </td>
                <td className="px-4 py-3 text-gray-700">{r.record_type}</td>
                <td className="px-4 py-3 text-gray-700">{studentLabel(r)}</td>
                <td className="px-4 py-3 text-gray-900">
                  {r.title && (
                    <span className="font-medium">{r.title}</span>
                  )}
                  {r.title && r.original_description && <br />}
                  <span className="text-gray-600">
                    {r.original_description.slice(0, 140)}
                    {r.original_description.length > 140 ? "…" : ""}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-700">
                  {r.bulletin_part ?? "—"}
                </td>
                <td className="px-4 py-3"><RecordStatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    {r.status !== "cancelado" && (
                      <Link
                        href={`/livro-de-dia/${b.id}?editRec=${r.id}`}
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                    {r.status !== "cancelado" && r.status !== "validado" && (
                      <form action={cancelRecord}>
                        <input
                          type="hidden"
                          name="daily_book_id"
                          value={b.id}
                        />
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-gray-700 hover:underline"
                        >
                          Cancelar
                        </button>
                      </form>
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
