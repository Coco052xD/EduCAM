import { redirect } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { DashboardShell } from "@/components/ui/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: educator } = await supabase.from("educators").select("name").eq("id", user.id).maybeSingle();
  if (!educator) redirect("/onboarding");
  return <DashboardShell displayName={educator.name}>{children}</DashboardShell>;
}
