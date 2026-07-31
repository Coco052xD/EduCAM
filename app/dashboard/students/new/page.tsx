import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export default async function NewStudentPage({ searchParams }: { searchParams: Promise<{ groupId?: string }> }) {
  const { groupId } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: groups }, { data: conditions }] = await Promise.all([
    supabase.from("student_groups").select("id,name,grade,school_year").order("name"),
    supabase.from("conditions").select("id,name").order("name"),
  ]);
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Nuevo alumno" title="Datos mínimos para planear" description="No solicites CURP, dirección, fecha de nacimiento, fotografías ni información clínica. La base guarda rango de edad, no fecha de nacimiento."/><StudentForm groups={groups ?? []} conditions={conditions ?? []} selectedGroupId={groupId}/></div>;
}
