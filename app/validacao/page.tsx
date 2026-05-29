import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { RecordStatusBadge } from "@/components/admin/RecordStatusBadge";
import { QUEUE_STATUSES, ALL_STATUSES } from "@/lib/validacao/status";

type Row = {
  id: string;
  record_type: string;
  reference_date: string;
  title: string;
  original_description: string;
  classification: string | null;
  status: string;
  platoon_id: string | null;
  student: { war_name: string; student_number: number } | { war_name: string; student_number: number }[] | null;
  platoon: { name: string } | { name: string }[] | null;
};

type Platoon = { id: string; name: string };

const RECORD_TYPE_OPTIONS = [
  "falta", "atraso", "baixa", "dispensa", "apresentação", "reapresentação",
  "instrução ministrada", "alteração de material", "alteração de QTS",
  "missão interna", "missão externa", "ocorrência disciplinar",
  "elogio", "recompensa", "punição", "aviso",
  "prescrição da Coordenação", "outro",
];

function pickOne<T>(v: T | T[] | null): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function studentLabel(r: Row): string {
  const s = pickOne(r.student);
  if (!s) return "—";
  return `#${s.student_number} ${s.war_name}`;
}

function platoonLabel(r: Row): string {
  const p = pickOne(r.platoon);
  return p?.name ?? "—";
}

type SearchParams = Promise<{
  date?: string;
  type?: string;
  status?: string;
  platoon?: string;
  ok?: string;
  err?: string;
}>;

export default async function ValidacaoQueuePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { date, type, status, platoon, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: plaRaw } = await supabase
    .from("platoons")
    .select("id, name")
    .eq("active", true)
    .order("name");
  const platoons = (plaRaw ?? []) as Platoon[];

  let query = supabase
    .from("records")
    .select(
      `id, record_type, reference_date, title, original_description, classification,
       status, platoon_id,
       student:students(war_name, student_number),
       platoon:platoons(name)`,
    )
    .order("reference_date", { ascending: false })
    .order("created_at", { ascending: false });

  // Filtro de status: específico, ou o conjunto padrão da fila.
  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", QUEUE_STATUSES);
  }
  if (date) query = query.eq("reference_date", date);
  if (type) query = query.eq("record_type", type);
  if (platoon) query = query.eq("platoon_id", platoon);

  const { data: rowsRaw } = await query;
  const rows = (rowsRaw ?? []) as unknown as Row[];

  return (
    <div>
      <PageHeader
        title="Validação"
        description="Registros pendentes de revisão da Coordenação."
      >
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
          ← Dashboard
        </Link>
      </PageHeader>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      {/* Filtros */}
      <form
        method="get"
        className="mb-4 mt-4 grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-5"
      >
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-slate-700">
            Data
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={date ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-slate-700">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {RECORD_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-slate-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Pendentes (padrão)</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="platoon" className="block text-xs font-medium text-slate-700">
            Pelotão
          </label>
          <select
            id="platoon"
            name="platoon"
            defaultValue={platoon ?? ""}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          >
            <option value="">Todos</option>
            {platoons.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Filtrar
          </button>
          <Link
            href="/validacao"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Limpar
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Pelotão</th>
              <th className="px-4 py-3">Título / Descrição</th>
              <th className="px-4 py-3">Classificação</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Nenhum registro para os filtros atuais.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const needsAttention =
                r.status === "enviado" || r.status === "pendente de correção";
              return (
                <tr key={r.id} className={needsAttention ? "bg-amber-50/40" : undefined}>
                  <td className="px-4 py-3 font-mono text-gray-700">{r.reference_date}</td>
                  <td className="px-4 py-3 text-gray-700">{r.record_type}</td>
                  <td className="px-4 py-3 text-gray-700">{studentLabel(r)}</td>
                  <td className="px-4 py-3 text-gray-700">{platoonLabel(r)}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {r.title && <span className="font-medium">{r.title}</span>}
                    {r.title && r.original_description && <br />}
                    <span className="text-gray-600">
                      {r.original_description.slice(0, 120)}
                      {r.original_description.length > 120 ? "…" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.classification ?? "—"}</td>
                  <td className="px-4 py-3">
                    <RecordStatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/validacao/${r.id}`}
                      className="text-sm font-medium text-slate-900 hover:underline"
                    >
                      Revisar
                    </Link>
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
