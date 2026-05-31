import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col py-10 sm:py-16">
      <div className="card p-7 sm:p-8">
        <div className="mb-6 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Acesso institucional
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Entrar no BI-CFO
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Use seu login do CFO.
          </p>
        </div>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        CBMAP · Academia Bombeiro Militar
      </p>
    </div>
  );
}
