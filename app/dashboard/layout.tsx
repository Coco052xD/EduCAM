import { redirect } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { DashboardShell } from "@/components/ui/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.schema("app").from("educator_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/onboarding");
  return <DashboardShell displayName={profile.display_name}>{children}</DashboardShell>;
}
