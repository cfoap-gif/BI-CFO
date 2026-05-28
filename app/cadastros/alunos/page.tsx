import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { TextField, SelectField } from "@/components/admin/Field";
import { FormFeedback } from "@/components/admin/FormFeedback";
import { upsertStudent, toggleStudentActive } from "./actions";

type Student = {
  id: string;
  student_number: number;
  full_name: string;
  war_name: string;
  platoon_id: string;
  registration_number: string | null;
  situation: string;
  phone: string | null;
  active: boolean;
  platoon: { name: string } | { name: string }[] | null;
};

function platoonName(p: Student["platoon"]): string {
  if (!p) return "—";
  const row = Array.isArray(p) ? p[0] : p;
  return row?.name ?? "—";
}

type Platoon = { id: string; name: string };

const SITUATIONS = [
  { value: "ativo", label: "Ativo" },
  { value: "desligado", label: "Desligado" },
  { value: "trancado", label: "Trancado" },
  { value: "baixa temporária", label: "Baixa temporária" },
  { value: "concluído", label: "Concluído" },
  { value: "outro", label: "Outro" },
];

type SearchParams = Promise<{ edit?: string; ok?: string; err?: string }>;

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { edit, ok, err } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const [{ data: studentsRaw }, { data: platoonsRaw }] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, student_number, full_name, war_name, platoon_id, registration_number, situation, phone, active, platoon:platoons(name)",
      )
      .order("platoon_id")
      .order("student_number"),
    supabase
      .from("platoons")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);

  const students = (studentsRaw ?? []) as unknown as Student[];
  const platoons = (platoonsRaw ?? []) as Platoon[];
  const editing = edit ? students.find((s) => s.id === edit) : undefined;

  const platoonOptions = platoons.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div>
      <PageHeader title="Alunos" description="Alunos oficiais do CFO.">
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
          {editing ? "Editar aluno" : "Novo aluno"}
        </h3>
        {platoonOptions.length === 0 ? (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Cadastre um pelotão ativo antes de criar alunos.
          </p>
        ) : (
          <form action={upsertStudent} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <TextField
              label="Número"
              name="student_number"
              type="number"
              required
              min={1}
              max={9999}
              defaultValue={editing?.student_number}
              hint="Único dentro do pelotão."
            />
            <SelectField
              label="Pelotão"
              name="platoon_id"
              required
              options={platoonOptions}
              defaultValue={editing?.platoon_id ?? ""}
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
              required
              defaultValue={editing?.war_name}
            />
            <SelectField
              label="Situação"
              name="situation"
              required
              options={SITUATIONS}
              defaultValue={editing?.situation ?? "ativo"}
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
                {editing ? "Salvar alterações" : "Criar aluno"}
              </SubmitButton>
              {editing && (
                <Link
                  href="/cadastros/alunos"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">N. Guerra</th>
              <th className="px-4 py-3">Pelotão</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Matrícula</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Nenhum aluno cadastrado.
                </td>
              </tr>
            )}
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-gray-700">{s.student_number}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{s.full_name}</td>
                <td className="px-4 py-3 text-gray-700">{s.war_name}</td>
                <td className="px-4 py-3 text-gray-700">{platoonName(s.platoon)}</td>
                <td className="px-4 py-3 text-gray-700">{s.situation}</td>
                <td className="px-4 py-3 text-gray-700">{s.registration_number ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge active={s.active} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/cadastros/alunos?edit=${s.id}`}
                      className="text-sm font-medium text-gray-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form action={toggleStudentActive}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="next" value={String(!s.active)} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-gray-700 hover:underline"
                      >
                        {s.active ? "Desativar" : "Ativar"}
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
