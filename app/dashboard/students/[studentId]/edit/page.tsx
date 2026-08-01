import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase } = await requireUser();
  const [{ data: student }, { data: groups }, { data: conditions }, { data: links }, { data: membership }] = await Promise.all([
    supabase.from("students").select("id,name,grade,age_range,profile_comment").eq("id", studentId).maybeSingle(),
    supabase.from("student_groups").select("id,name,grade,school_year").order("name"),
    supabase.from("conditions").select("id,name").order("name"),
    supabase.from("student_conditions").select("condition_id").eq("student_id", studentId),
    supabase.from("student_group_members").select("group_id").eq("student_id", studentId).maybeSingle(),
  ]);
  if (!student) notFound();
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Editar alumno" title={student.name} description="Mantén solo la información mínima necesaria para apoyar la planeación."/><StudentForm groups={groups ?? []} conditions={conditions ?? []} initial={{ ...student, groupId: membership?.group_id ?? "", conditionIds: links?.map((item) => item.condition_id) ?? [] }}/></div>;
}
