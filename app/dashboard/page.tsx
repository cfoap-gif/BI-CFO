import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCurrentProfileName,
  isAdminLike,
  isDailyBookUser,
} from "@/lib/auth/profile";
import { signOut } from "./actions";

type UserRow = {
  login: string;
  full_name: string;
  war_name: string | null;
  profiles: { name: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userRow, error } = await supabase
    .from("users")
    .select("login, full_name, war_name, profiles(name)")
    .single<UserRow>();

  const profile = await getCurrentProfileName();
  const canManageCadastros = isAdminLike(profile);
  const canOpenDailyBook = isDailyBookUser(profile);
  const canAccessRepositorio = canManageCadastros || profile === "Consulta";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500">
          Marco M8 — auditoria, PDF e repositório documental disponíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canManageCadastros && (
          <Link
            href="/cadastros"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Cadastros</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pelotões, militares, locais, disciplinas e alunos.
            </p>
          </Link>
        )}
        {canManageCadastros && (
          <Link
            href="/escalas"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Escalas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Serviços diários, permanência, missões e apoio.
            </p>
          </Link>
        )}
        {canManageCadastros && (
          <Link
            href="/validacao"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Validação</h3>
            <p className="mt-1 text-sm text-gray-500">
              Revisar, validar e classificar registros para o BI.
            </p>
          </Link>
        )}
        {canManageCadastros && (
          <Link
            href="/boletins"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Boletins Internos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Criar BI, montar prévia e aprovar a versão final.
            </p>
          </Link>
        )}
        {canAccessRepositorio && (
          <Link
            href="/repositorio"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Repositório</h3>
            <p className="mt-1 text-sm text-gray-500">
              Consultar BIs aprovados e baixar PDFs arquivados.
            </p>
          </Link>
        )}
        {canOpenDailyBook && (
          <Link
            href="/livro-de-dia"
            className="block rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900">Livro de Dia</h3>
            <p className="mt-1 text-sm text-gray-500">
              Registro diário da rotina + lançamentos.
            </p>
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-sm font-medium uppercase tracking-wide text-gray-500">
          Usuário autenticado
        </h3>
        {error || !userRow ? (
          <p className="mt-3 text-sm text-red-600">
            Não foi possível ler o registro institucional do usuário (
            {error?.message ?? "registro ausente em public.users"}). Verifique
            o seed e as políticas de RLS.
          </p>
        ) : (
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500">Login</dt>
              <dd className="font-medium text-gray-900">{userRow.login}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nome completo</dt>
              <dd className="font-medium text-gray-900">{userRow.full_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Nome de guerra</dt>
              <dd className="font-medium text-gray-900">
                {userRow.war_name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Perfil</dt>
              <dd className="font-medium text-gray-900">
                {userRow.profiles?.name ?? "—"}
              </dd>
            </div>
          </dl>
        )}
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Sair
        </button>
      </form>
    </div>
  );
}
