import type { Metadata } from "next";
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
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">
                CBMAP — Academia Bombeiro Militar
              </p>
              <h1 className="text-lg font-semibold text-gray-900">
                BI-CFO · Boletim Interno do Curso de Formação de Oficiais
              </h1>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
