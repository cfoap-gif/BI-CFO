import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  loadAuditActorDisplayMap,
  UNKNOWN_AUDIT_ACTOR,
} from "@/lib/audit/actors";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SelectField, TextAreaField } from "@/components/admin/Field";
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";
import { BULLETIN_PARTS, CLASSIFICATIONS } from "@/lib/records/options";
import {
  markInReview,
  validateRecord,
  returnForCorrection,
  updatePublicationText,
} from "./actions";

type RecordDetail = {
  id: string;
  record_type: string;
  reference_date: string;
  title: string;
  original_description: string;
  publication_text: string;
  classification: string | null;
  status: string;
  include_in_bulletin: boolean;
  bulletin_part: number | null;
  coordination_note: string;
  validated_at: string | null;
  student: { war_name: string; student_number: number } | { war_name: string; student_number: number }[] | null;
  platoon: { name: string } | { name: string }[] | null;
  discipline: { name: string } | { name: string }[] | null;
};

type EventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string;
  note: string;
  created_by: string | null;
  created_at: string;
};

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function ValidacaoDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: rec } = await supabase
    .from("records")
    .select(
      `id, record_type, reference_date, title, original_description, publication_text,
       classification, status, include_in_bulletin, bulletin_part, coordination_note,
       validated_at,
       student:students(war_name, student_number),
       platoon:platoons(name),
       discipline:disciplines(name)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!rec) notFound();
  const r = rec as unknown as RecordDetail;

  const { data: evRaw } = await supabase
    .from("record_events")
    .select("id, event_type, from_status, to_status, note, created_by, created_at")
    .eq("record_id", id)
    .order("created_at", { ascending: false });
  const events = (evRaw ?? []) as EventRow[];
  const actorNames = await loadAuditActorDisplayMap(
    supabase,
    events.map((ev) => ev.created_by),
  );

  const student = pickOne(r.student);
  const platoon = pickOne(r.platoon);
  const discipline = pickOne(r.discipline);

  const isReviewing = r.status === "em revisão";
  const isSubmitted = r.status === "enviado";

  return (
    <div>
      <PageHeader title={`Registro — ${r.record_type}`} description={`Data: ${r.reference_date}`}>
        <Link href="/validacao" className="text-sm text-gray-600 hover:text-gray-900">
          ← Fila
        </Link>
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Status:</span>
        <RecordStatusBadge status={r.status} />
      </div>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coluna esquerda: registro (somente leitura) + histórico */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Registro original
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Título</dt>
                <dd className="font-medium text-gray-900">{r.title || "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Aluno</dt>
                <dd className="text-gray-900">
                  {student ? `#${student.student_number} ${student.war_name}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Pelotão</dt>
                <dd className="text-gray-900">{platoon?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Disciplina</dt>
                <dd className="text-gray-900">{discipline?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Descrição original (preservada)</dt>
                <dd className="whitespace-pre-wrap text-gray-900">
                  {r.original_description}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Histórico
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              {events.length === 0 && (
                <li className="text-gray-500">Sem eventos registrados.</li>
              )}
              {events.map((ev) => (
                <li key={ev.id} className="border-l-2 border-gray-200 pl-3">
                  <div className="font-medium text-gray-900">
                    {ev.from_status ? `${ev.from_status} → ` : ""}
                    {ev.to_status}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(ev.created_at).toLocaleString("pt-BR")} · Autor:{" "}
                    {ev.created_by
                      ? (actorNames.get(ev.created_by) ?? UNKNOWN_AUDIT_ACTOR)
                      : UNKNOWN_AUDIT_ACTOR}
                  </div>
                  {ev.note && (
                    <div className="mt-1 text-gray-700">{ev.note}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Coluna direita: painel de ação */}
        <div className="space-y-6">
          {isSubmitted && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                Iniciar revisão
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Coloque o registro em revisão para validar ou devolver.
              </p>
              <form action={markInReview} className="mt-4">
                <input type="hidden" name="id" value={r.id} />
                <SubmitButton>Colocar em revisão</SubmitButton>
              </form>
            </div>
          )}

          {/* Texto de publicação (US-022) — editável quando em revisão. */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Texto para o BI
            </h3>
            <form action={updatePublicationText} className="mt-4 space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <TextAreaField
                label="Texto de publicação"
                name="publication_text"
                defaultValue={r.publication_text}
                rows={4}
                hint="Editado pela Coordenação. Não altera a descrição original."
              />
              <SubmitButton>Salvar texto</SubmitButton>
            </form>
          </div>

          {/* Validar / Devolver — apenas quando em revisão (US-019/020/021). */}
          {isReviewing && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Validar registro
                </h3>
                <form action={validateRecord} className="mt-4 space-y-4">
                  <input type="hidden" name="id" value={r.id} />
                  <SelectField
                    label="Classificação"
                    name="classification"
                    required
                    options={CLASSIFICATIONS}
                    defaultValue={r.classification ?? ""}
                  />
                  <TextAreaField
                    label="Texto de publicação"
                    name="publication_text"
                    defaultValue={r.publication_text}
                    rows={3}
                    hint="Confirme o texto que irá ao BI (se publicável)."
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      name="include_in_bulletin"
                      defaultChecked={r.include_in_bulletin}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Incluir no Boletim Interno (apenas se publicável)
                  </label>
                  <SelectField
                    label="Parte do BI"
                    name="bulletin_part"
                    options={BULLETIN_PARTS}
                    defaultValue={
                      r.bulletin_part != null ? String(r.bulletin_part) : ""
                    }
                    hint="Aplicada apenas quando incluído no BI."
                  />
                  <SubmitButton>Validar</SubmitButton>
                </form>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  Devolver para correção
                </h3>
                <form action={returnForCorrection} className="mt-4 space-y-3">
                  <input type="hidden" name="id" value={r.id} />
                  <TextAreaField
                    label="Motivo da devolução"
                    name="note"
                    required
                    rows={3}
                    hint="Obrigatório. Fica registrado no histórico."
                  />
                  <SubmitButton>Devolver</SubmitButton>
                </form>
              </div>
            </>
          )}

          {r.status === "validado" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800">
              Registro validado
              {r.validated_at
                ? ` em ${new Date(r.validated_at).toLocaleString("pt-BR")}`
                : ""}
              .{" "}
              {r.include_in_bulletin
                ? `Marcado para o BI (parte ${r.bulletin_part ?? "?"}).`
                : "Não entra no BI."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
