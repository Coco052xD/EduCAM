import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { StudentForm } from "@/components/students/student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: student }, { data: groups }, { data: conditions }, { data: links }] = await Promise.all([
    app.from("students").select("id,group_id,nickname,age_value,age_range,educational_level,enrolled_grade").eq("id", studentId).eq("educator_id", user.id).maybeSingle(),
    app.from("groups").select("id,name,educational_level,academic_grade").eq("educator_id", user.id).eq("active", true),
    supabase.schema("knowledge").from("conditions").select("id,name").eq("active", true).order("name"),
    app.from("student_conditions").select("condition_id").eq("student_id", studentId),
  ]);
  if (!student) notFound();
  return <div className="mx-auto max-w-3xl"><PageHeader eyebrow="Editar alumno" title={student.nickname} description="Mantén solo la información mínima necesaria para apoyar la planeación."/><StudentForm groups={groups ?? []} conditions={conditions ?? []} initial={{...student, conditionIds: links?.map((item) => item.condition_id) ?? []}}/></div>;
}
