import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfileName, isAdminLike } from "@/lib/auth/profile";

export default async function EscalasLayout({
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
  if (!isAdminLike(profile)) redirect("/dashboard");

  return <>{children}</>;
}
