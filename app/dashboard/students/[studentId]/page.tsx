import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, Pencil } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";

export default async function StudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: student }, { data: profile }, { data: links }] = await Promise.all([
    app.from("students").select("id,nickname,age_value,age_range,educational_level,enrolled_grade,group_id,groups(name)").eq("id", studentId).eq("educator_id", user.id).maybeSingle(),
    app.from("learning_profiles").select("*").eq("student_id", studentId).maybeSingle(),
    app.from("student_conditions").select("condition_id").eq("student_id", studentId),
  ]);
  if (!student) notFound();
  const ids = links?.map((item) => item.condition_id) ?? [];
  const { data: conditions } = ids.length ? await supabase.schema("knowledge").from("conditions").select("id,name").in("id", ids) : { data: [] };
  const groupsValue = student.groups as unknown as { name?: string } | { name?: string }[] | null;
  const groupName = Array.isArray(groupsValue) ? groupsValue[0]?.name : groupsValue?.name;
  return <div className="grid gap-8"><PageHeader eyebrow={groupName ?? "Alumno"} title={student.nickname} description={`${student.age_value ? `${student.age_value} años` : student.age_range} · ${student.educational_level} · ${student.enrolled_grade}`} action={<div className="flex flex-wrap gap-2"><Link className="button button-secondary" href={`/dashboard/students/${student.id}/edit`}><Pencil size={17}/>Editar</Link><Link className="button" href={`/dashboard/students/${student.id}/learning-profile`}><BookOpenCheck size={17}/>{profile ? "Actualizar perfil" : "Completar perfil"}</Link></div>}/>
    <section className="grid gap-5 md:grid-cols-2"><div className="card p-6"><h2 className="section-title">Condiciones seleccionadas</h2><div className="mt-4 flex flex-wrap gap-2">{conditions?.map((condition) => <span className="chip" key={condition.id}>{condition.name}</span>)}</div><p className="muted mt-5 text-xs">Se usan solo para recuperar recomendaciones pedagógicas aprobadas.</p></div><div className="card p-6"><h2 className="section-title">Perfil de aprendizaje</h2>{profile ? <><p className="mt-4 font-bold">Formatos preferidos</p><p className="muted mt-1 text-sm">{profile.preferred_instruction_formats.join(", ")}</p><p className="mt-4 font-bold">Apoyos que han funcionado</p><p className="muted mt-1 text-sm">{profile.successful_supports.join(", ")}</p></> : <p className="muted mt-4">Aún no está completo. Es necesario antes de generar actividades para este alumno.</p>}</div></section>
  </div>;
}
