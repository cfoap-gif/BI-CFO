import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";

export default async function BoletinsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Publicação do BI é atribuição da Coordenação (e Administrador).
  const profile = await getCurrentProfileName();
  if (!isAdminLike(profile)) redirect("/dashboard");

  return <>{children}</>;
}
