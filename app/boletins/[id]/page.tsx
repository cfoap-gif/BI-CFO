import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { BulletinStatusBadge } from "@/components/admin/BulletinStatusBadge";
import { BULLETIN_PARTS } from "@/lib/records/options";
import {
  assembleItems,
  toggleItemVisible,
  reorderItem,
  updateItemContent,
  approveBulletin,
  reopenBulletin,
  cancelBulletin,
} from "./actions";

type Bulletin = {
  id: string;
  number: number;
  year: number;
  publication_date: string | null;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  approved_at: string | null;
};

type Item = {
  id: string;
  part_number: number;
  reference_date: string | null;
  title: string;
  content: string;
  display_order: number;
  visible: boolean;
};

type EventRow = {
  id: string;
  event_type: string;
  note: string;
  created_at: string;
};

type SearchParams = Promise<{ ok?: string; err?: string }>;

export default async function BulletinDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: bRaw } = await supabase
    .from("bulletins")
    .select(
      "id, number, year, publication_date, start_date, end_date, type, status, approved_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (!bRaw) notFound();
  const b = bRaw as Bulletin;

  const { data: itemsRaw } = await supabase
    .from("bulletin_items")
    .select("id, part_number, reference_date, title, content, display_order, visible")
    .eq("bulletin_id", id)
    .order("part_number", { ascending: true })
    .order("display_order", { ascending: true });
  const items = (itemsRaw ?? []) as Item[];

  const { data: evRaw } = await supabase
    .from("bulletin_events")
    .select("id, event_type, note, created_at")
    .eq("bulletin_id", id)
    .order("created_at", { ascending: false });
  const events = (evRaw ?? []) as EventRow[];

  const isDraft = b.status === "rascunho";
  const isApproved = b.status === "aprovado";
  const periodo =
    b.start_date + (b.start_date !== b.end_date ? ` — ${b.end_date}` : "");

  return (
    <div>
      <PageHeader
        title={`BI ${b.number}/${b.year}`}
        description={`${b.type} · ${periodo}`}
      >
        <Link href="/boletins" className="text-sm text-gray-600 hover:text-gray-900">
          ← Lista
        </Link>
        <Link
          href={`/boletins/${b.id}/previa`}
          className="text-sm font-medium text-slate-900 hover:underline"
        >
          Ver prévia
        </Link>
        {isApproved && (
          <Link
            href={`/boletins/${b.id}/pdf`}
            className="text-sm font-medium text-slate-900 hover:underline"
          >
            Baixar PDF
          </Link>
        )}
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-gray-500">Status:</span>
        <BulletinStatusBadge status={b.status} />
      </div>

      <FormFeedback message={ok ?? null} variant="success" />
      <FormFeedback message={err ?? null} variant="error" />

      {/* Ações de status */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
        {isDraft && (
          <form action={assembleItems}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton variant="secondary">Montar itens (dos registros validados)</SubmitButton>
          </form>
        )}
        {isDraft && (
          <form action={approveBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton>Aprovar boletim</SubmitButton>
          </form>
        )}
        {isApproved && (
          <form action={reopenBulletin} className="flex items-end gap-2">
            <input type="hidden" name="id" value={b.id} />
            <input
              type="text"
              name="note"
              required
              placeholder="Motivo da reabertura"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <SubmitButton variant="secondary">Reabrir</SubmitButton>
          </form>
        )}
        {b.status !== "cancelado" && (
          <form action={cancelBulletin}>
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton variant="danger">Cancelar</SubmitButton>
          </form>
        )}
        {isApproved && b.approved_at && (
          <span className="text-xs text-emerald-700">
            Aprovado em {new Date(b.approved_at).toLocaleString("pt-BR")}
          </span>
        )}
      </div>

      {/* Itens agrupados por parte */}
      <div className="mt-6 space-y-6">
        {BULLETIN_PARTS.map((p) => {
          const part = Number(p.value);
          const partItems = items.filter((it) => it.part_number === part);
          return (
            <div key={p.value} className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
                {p.label}
              </h3>
              {partItems.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Sem itens nesta parte.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {partItems.map((it) => (
                    <li
                      key={it.id}
                      className={`rounded-md border p-3 ${
                        it.visible ? "border-gray-200" : "border-gray-200 bg-gray-50 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-mono text-xs text-gray-500">
                            {it.reference_date ?? "—"}
                          </div>
                          {isDraft ? (
                            <form action={updateItemContent} className="mt-1 space-y-2">
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="item_id" value={it.id} />
                              <input
                                type="text"
                                name="title"
                                defaultValue={it.title}
                                placeholder="Título"
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                              />
                              <textarea
                                name="content"
                                defaultValue={it.content}
                                rows={2}
                                className="block w-full rounded-md border border-slate-300 px-2 py-1 text-sm leading-relaxed text-slate-900"
                              />
                              <SubmitButton variant="secondary">Salvar</SubmitButton>
                            </form>
                          ) : (
                            <>
                              {it.title && (
                                <div className="font-medium text-gray-900">{it.title}</div>
                              )}
                              <div className="whitespace-pre-wrap text-sm text-gray-700">
                                {it.content}
                              </div>
                            </>
                          )}
                        </div>
                        {isDraft && (
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <div className="flex gap-1">
                              <form action={reorderItem}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="item_id" value={it.id} />
                                <input type="hidden" name="direction" value="up" />
                                <button type="submit" className="px-1 text-sm text-gray-600 hover:text-gray-900">↑</button>
                              </form>
                              <form action={reorderItem}>
                                <input type="hidden" name="id" value={b.id} />
                                <input type="hidden" name="item_id" value={it.id} />
                                <input type="hidden" name="direction" value="down" />
                                <button type="submit" className="px-1 text-sm text-gray-600 hover:text-gray-900">↓</button>
                              </form>
                            </div>
                            <form action={toggleItemVisible}>
                              <input type="hidden" name="id" value={b.id} />
                              <input type="hidden" name="item_id" value={it.id} />
                              <input type="hidden" name="next" value={String(!it.visible)} />
                              <button type="submit" className="text-xs font-medium text-gray-600 hover:underline">
                                {it.visible ? "Ocultar" : "Mostrar"}
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Histórico
        </h3>
        <ul className="mt-4 space-y-3 text-sm">
          {events.length === 0 && <li className="text-gray-500">Sem eventos.</li>}
          {events.map((ev) => (
            <li key={ev.id} className="border-l-2 border-gray-200 pl-3">
              <div className="font-medium text-gray-900">{ev.event_type}</div>
              <div className="text-xs text-gray-500">
                {new Date(ev.created_at).toLocaleString("pt-BR")}
              </div>
              {ev.note && <div className="mt-1 text-gray-700">{ev.note}</div>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
