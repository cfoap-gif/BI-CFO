import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertMilitary, toggleMilitaryActive } from "./actions";

type Military = {
  id: string;
  rank: string | null;
  full_name: string;
  war_name: string | null;
  registration_number: string | null;
  staff_type: string;
  phone: string | null;
  active: boolean;
};

const TYPES = [
  { value: "coordenação", label: "Coordenação" },
  { value: "instrutor", label: "Instrutor" },
  { value: "monitor", label: "Monitor" },
  { value: "apoio", label: "Apoio" },
  { value: "comandante", label: "Comandante" },
  { value: "outro", label: "Outro" },
];

type SearchParams = Promise<{ edit?: string; ok?: string; err?: string }>;

export default async function MilitaresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("military_staff")
    .select("id, rank, full_name, war_name, registration_number, staff_type, phone, active")
    .order("full_name");

  const list: Military[] = data ?? [];
  const editing = edit ? list.find((m) => m.id === edit) : undefined;

  return (
    <div>
      <PageHeader
        title="Militares e Instrutores"
        description="Coordenação, instrutores, monitores e apoio."
      >
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
          {editing ? "Editar militar" : "Novo militar"}
        </h3>
        <form action={upsertMilitary} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <TextField
            label="Posto/Graduação"
            name="rank"
            defaultValue={editing?.rank ?? undefined}
            placeholder="ex.: Cap, 1º Ten"
          />
          <SelectField
            label="Tipo"
            name="staff_type"
            required
            options={TYPES}
            defaultValue={editing?.staff_type ?? "outro"}
          />
          <TextField
            label="Nome completo"
            name="full_name"
            required
            defaultValue={editing?.full_name}
            className="sm:col-span-2"
          />
          <TextField
            label="Nome de guerra"
            name="war_name"
            defaultValue={editing?.war_name ?? undefined}
          />
          <TextField
            label="Matrícula"
            name="registration_number"
            defaultValue={editing?.registration_number ?? undefined}
          />
          <TextField
            label="Telefone"
            name="phone"
            type="tel"
            defaultValue={editing?.phone ?? undefined}
          />
          <div className="flex gap-2 pt-2 sm:col-span-2">
            <SubmitButton>
              {editing ? "Salvar alterações" : "Criar militar"}
            </SubmitButton>
            {editing && (
              <Link
                href="/cadastros/militares"
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
              <th className="px-4 py-3">Posto</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">N. Guerra</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Nenhum militar cadastrado.
                </td>
              </tr>
            )}
            {list.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-gray-700">{m.rank ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.full_name}</td>
                <td className="px-4 py-3 text-gray-700">{m.war_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{m.staff_type}</td>
                <td className="px-4 py-3 text-gray-700">{m.registration_number ?? "—"}</td>
                <td className="px-4 py-3 text-gray-700">{m.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={m.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cadastros/militares?edit=${m.id}`}
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleMilitaryActive}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="next" value={String(!m.active)} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        {m.active ? "Desativar" : "Ativar"}
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
