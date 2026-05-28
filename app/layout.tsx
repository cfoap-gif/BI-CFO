import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "BI-CFO — Sistema de Boletim Interno do CFO",
  description:
    "Sistema de Boletim Interno do Curso de Formação de Oficiais — CBMAP/ABM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm">
                <span className="text-[11px] font-bold tracking-wider">
                  CFO
                </span>
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  CBMAP · Academia Bombeiro Militar
                </p>
                <h1 className="text-sm font-semibold text-slate-900 sm:text-base">
                  BI-CFO · Boletim Interno do CFO
                </h1>
              </div>
            </Link>
          </div>
          <div className="institutional-stripe" aria-hidden="true" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
