import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const { groupId } = await searchParams;
  const { supabase, user } = await requireUser();
  const [{ data: groups }, { data: conditions }] = await Promise.all([
    supabase.schema("app").from("groups").select("id,name,educational_level,academic_grade").eq("educator_id", user.id).eq("active", true).order("name"),
    supabase.schema("knowledge").from("conditions").select("id,name").eq("active", true).order("name"),
  ]);
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Nuevo alumno" title="Datos mínimos para planear" description="No solicites CURP, dirección, fecha de nacimiento, fotografías ni información clínica."/><StudentForm groups={groups ?? []} conditions={conditions ?? []} selectedGroupId={groupId}/></div>;
}
