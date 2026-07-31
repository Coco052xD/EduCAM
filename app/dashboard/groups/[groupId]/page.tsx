import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GroupForm } from "@/components/groups/group-form";

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: group }, { data: students }] = await Promise.all([
    app.from("groups").select("id,name,educational_level,academic_grade,school_cycle").eq("id", groupId).eq("educator_id", user.id).maybeSingle(),
    app.from("students").select("id,nickname,age_value,age_range,enrolled_grade,learning_profiles(id)").eq("group_id", groupId).eq("educator_id", user.id).eq("active", true).order("created_at"),
  ]);
  if (!group) notFound();
  return <div className="grid gap-9"><PageHeader eyebrow={`${group.educational_level} · ${group.academic_grade}`} title={group.name} description={group.school_cycle ? `Ciclo ${group.school_cycle}` : "Sin ciclo escolar registrado"} action={<div className="flex flex-wrap gap-2"><Link className="button button-secondary" href={`/dashboard/students/new?groupId=${group.id}`}><Plus size={18}/>Agregar alumno</Link><Link className="button" href={`/dashboard/activities/new?groupId=${group.id}`}><Sparkles size={18}/>Crear actividad</Link></div>}/>
    <section><h2 className="section-title mb-4">Alumnos</h2>{students?.length ? <div className="grid-cards">{students.map((student) => { const complete = Array.isArray(student.learning_profiles) && student.learning_profiles.length > 0; return <Link href={`/dashboard/students/${student.id}`} className="card p-5 transition hover:border-[#176b5c]" key={student.id}><div className="flex items-center justify-between gap-2"><h3 className="font-extrabold">{student.nickname}</h3><span className={`chip ${complete ? "" : "!bg-[#fff3df] !text-[#80500c]"}`}>{complete ? "Perfil completo" : "Perfil pendiente"}</span></div><p className="muted mt-3 text-sm">{student.age_value ? `${student.age_value} años` : student.age_range} · {student.enrolled_grade}</p></Link>; })}</div> : <EmptyState title="No hay alumnos en este grupo" description="Agrega un alumno usando solo nombre o apodo y datos escolares mínimos." action={<Link className="button" href={`/dashboard/students/new?groupId=${group.id}`}>Agregar alumno</Link>}/>}</section>
    <details className="card p-6"><summary className="cursor-pointer font-extrabold">Editar datos del grupo</summary><GroupForm initial={group}/></details>
  </div>;
}
