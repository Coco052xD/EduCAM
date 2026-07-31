import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityGeneratorForm } from "@/components/activities/activity-generator-form";
import type { Group, Student, Subject, Topic } from "@/types/database";

export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const { groupId } = await searchParams;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: groups }, { data: students }, { data: profiles }, { data: subjects }, { data: topics }] = await Promise.all([
    app.from("groups").select("*").eq("educator_id", user.id).eq("active", true).order("name"),
    app.from("students").select("*").eq("educator_id", user.id).eq("active", true).order("nickname"),
    app.from("learning_profiles").select("student_id"),
    supabase.schema("curriculum").from("subjects").select("*").eq("active", true).order("name"),
    supabase.schema("curriculum").from("topics").select("id,subject_id,name,learning_objective").eq("active", true).order("name"),
  ]);
  const complete = new Set(profiles?.map((profile) => profile.student_id));
  const studentsWithProfile = (students ?? []).map((student) => ({ ...student, profileComplete: complete.has(student.id) }));
  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Nueva actividad" title="Construye el punto de partida" description="El objetivo curricular, los perfiles desidentificados y tu retroalimentación previa formarán el contexto para Gemma."/><ActivityGeneratorForm groups={(groups ?? []) as Group[]} students={studentsWithProfile as (Student & { profileComplete: boolean })[]} subjects={(subjects ?? []) as Subject[]} topics={(topics ?? []) as Topic[]} initialGroupId={groupId}/></div>;
}
