import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertPlatoon, togglePlatoonActive } from "./actions";

type Platoon = {
  id: string;
  name: string;
  description: string;
  cfo_year: number | null;
  active: boolean;
};

type SearchParams = Promise<{ edit?: string; ok?: string; err?: string }>;

export default async function PelotoesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("platoons")
    .select("id, name, description, cfo_year, active")
    .order("name");

  const platoons: Platoon[] = data ?? [];
  const editing = edit ? platoons.find((p) => p.id === edit) : undefined;

  return (
    <div>
      <PageHeader title="Pelotões" description="Pelotões do CFO.">
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
          {editing ? "Editar pelotão" : "Novo pelotão"}
        </h3>
        <form action={upsertPlatoon} className="mt-4 space-y-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <TextField
            label="Nome"
            name="name"
            required
            defaultValue={editing?.name}
            placeholder="ex.: 1º Pelotão"
          />
          <TextField
            label="Descrição"
            name="description"
            defaultValue={editing?.description}
          />
          <TextField
            label="Ano do CFO"
            name="cfo_year"
            type="number"
            min={2000}
            max={2099}
            defaultValue={editing?.cfo_year ?? undefined}
          />
          <div className="flex gap-2 pt-2">
            <SubmitButton>
              {editing ? "Salvar alterações" : "Criar pelotão"}
            </SubmitButton>
            {editing && (
              <Link
                href="/cadastros/pelotoes"
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
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Ano</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {platoons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Nenhum pelotão cadastrado.
                </td>
              </tr>
            )}
            {platoons.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-gray-700">{p.description || "—"}</td>
                <td className="px-4 py-3 text-gray-700">{p.cfo_year ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={p.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cadastros/pelotoes?edit=${p.id}`}
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={togglePlatoonActive}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="next" value={String(!p.active)} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        {p.active ? "Desativar" : "Ativar"}
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
