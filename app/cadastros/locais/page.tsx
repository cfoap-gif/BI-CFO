import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertLocation, toggleLocationActive } from "./actions";

type Location = {
  id: string;
  name: string;
  description: string;
  address: string | null;
  location_type: string;
  active: boolean;
};

const TYPES = [
  { value: "sala de aula", label: "Sala de aula" },
  { value: "pátio", label: "Pátio" },
  { value: "campo de instrução", label: "Campo de instrução" },
  { value: "unidade operacional", label: "Unidade operacional" },
  { value: "local externo", label: "Local externo" },
  { value: "auditório", label: "Auditório" },
  { value: "outro", label: "Outro" },
];

type SearchParams = Promise<{ edit?: string; ok?: string; err?: string }>;

export default async function LocaisPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("locations")
    .select("id, name, description, address, location_type, active")
    .order("name");

  const locations: Location[] = data ?? [];
  const editing = edit ? locations.find((l) => l.id === edit) : undefined;

  return (
    <div>
      <PageHeader title="Locais" description="Locais de instrução, serviço e missão.">
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
          {editing ? "Editar local" : "Novo local"}
        </h3>
        <form action={upsertLocation} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <TextField
            label="Nome"
            name="name"
            required
            defaultValue={editing?.name}
            placeholder="ex.: Sala 01"
          />
          <SelectField
            label="Tipo"
            name="location_type"
            required
            options={TYPES}
            defaultValue={editing?.location_type ?? "outro"}
          />
          <TextField
            label="Endereço"
            name="address"
            defaultValue={editing?.address ?? undefined}
            className="sm:col-span-2"
          />
          <TextField
            label="Descrição"
            name="description"
            defaultValue={editing?.description}
            className="sm:col-span-2"
          />
          <div className="flex gap-2 pt-2 sm:col-span-2">
            <SubmitButton>
              {editing ? "Salvar alterações" : "Criar local"}
            </SubmitButton>
            {editing && (
              <Link
                href="/cadastros/locais"
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
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Endereço</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Nenhum local cadastrado.
                </td>
              </tr>
            )}
            {locations.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                <td className="px-4 py-3 text-gray-700">{l.location_type}</td>
                <td className="px-4 py-3 text-gray-700">{l.address ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={l.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cadastros/locais?edit=${l.id}`}
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleLocationActive}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="next" value={String(!l.active)} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        {l.active ? "Desativar" : "Ativar"}
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
