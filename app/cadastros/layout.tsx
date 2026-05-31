import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";

export default async function CadastrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) {
    // Outros perfis podem ler dados de cadastro indiretamente (selects em
    // formulários futuros), mas não acessam a área de gestão.
    redirect("/dashboard");
  }

  return <>{children}</>;
}
