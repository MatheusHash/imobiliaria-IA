import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ next?: string }> };

function getSafeNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }

  return next;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const next = getSafeNextPath((await searchParams).next);
  const user = await getCurrentUser();

  if (user) redirect(next);

  return (
    <main className="container-page flex min-h-[calc(100vh-13rem)] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Acesso restrito</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Entrar no admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Faça login para gerenciar os imóveis cadastrados.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="font-medium text-foreground underline-offset-4 hover:underline" href="/">
            Voltar para o site
          </Link>
        </p>
      </div>
    </main>
  );
}
