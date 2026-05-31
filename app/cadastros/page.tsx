import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";

const CARDS = [
  {
    href: "/cadastros/pelotoes",
    title: "Pelotões",
    description: "Pelotões do CFO (ex.: 1º Pelotão, Turma única).",
  },
  {
    href: "/cadastros/militares",
    title: "Militares e Instrutores",
    description: "Coordenação, instrutores, monitores e apoio.",
  },
  {
    href: "/cadastros/locais",
    title: "Locais",
    description: "Locais de instrução, serviço e missão.",
  },
  {
    href: "/cadastros/disciplinas",
    title: "Disciplinas",
    description: "Disciplinas do CFO com carga horária e tipo.",
  },
  {
    href: "/cadastros/alunos",
    title: "Alunos",
    description: "Alunos oficiais vinculados a um pelotão.",
  },
];

export default function CadastrosHub() {
  return (
    <div>
      <PageHeader
        title="Cadastros"
        description="Base institucional usada por todo o sistema."
      >
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-gray-900 hover:shadow-sm"
          >
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-900">
              {c.title}
            </h3>
            <p className="mt-1 text-sm text-gray-500">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
