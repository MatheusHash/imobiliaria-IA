import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Prime Lar Imobiliária",
  description: "Sistema web para imobiliária com catálogo público e administração de imóveis."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body>
        <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
          <div className="container-page flex h-16 items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">
              Prime Lar
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
              <Link className="hover:text-slate-950" href="/imoveis">Imóveis</Link>
              {user ? (
                <>
                  <Link className="hover:text-slate-950" href="/admin/imoveis">Admin</Link>
                </>
              ) : (
                <Link className="hover:text-slate-950" href="/login">Entrar</Link>
              )}
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-16 border-t bg-slate-950 py-8 text-slate-300">
          <div className="container-page flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Prime Lar Imobiliária</p>
            <p className="text-sm">Venda, locação e administração de imóveis.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
