import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { GroupForm } from "@/components/groups/group-form";
import type { Student } from "@/types/database";

type Member = { students: Pick<Student, "id" | "name" | "grade" | "age_range" | "active"> & { student_profile_answers: { count: number }[] } };

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const { supabase } = await requireUser();
  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from("student_groups").select("id,name,grade,school_year").eq("id", groupId).maybeSingle(),
    supabase
      .from("student_group_members")
      .select("students(id,name,grade,age_range,active,student_profile_answers(count))")
      .eq("group_id", groupId),
  ]);
  if (!group) notFound();
  const students = ((members ?? []) as unknown as Member[]).map((row) => row.students).filter((student) => student?.active);
  return <div className="grid gap-9"><PageHeader eyebrow={`${group.grade}.º de primaria`} title={group.name} description={`Ciclo ${group.school_year}`} action={<div className="flex flex-wrap gap-2"><Link className="button button-secondary" href={`/dashboard/students/new?groupId=${group.id}`}><Plus size={18}/>Agregar alumno</Link><Link className="button" href="/dashboard/recommendations/new"><Sparkles size={18}/>Nueva recomendación</Link></div>}/>
    <section><h2 className="section-title mb-4">Alumnos</h2>{students.length ? <div className="grid-cards">{students.map((student) => { const complete = (student.student_profile_answers?.[0]?.count ?? 0) > 0; return <Link href={`/dashboard/students/${student.id}`} className="card p-5 transition hover:border-[#176b5c]" key={student.id}><div className="flex items-center justify-between gap-2"><h3 className="font-extrabold">{student.name}</h3><span className={`chip ${complete ? "" : "!bg-[#fff3df] !text-[#80500c]"}`}>{complete ? "Perfil completo" : "Perfil pendiente"}</span></div><p className="muted mt-3 text-sm">{student.age_range} años · {student.grade}.º</p></Link>; })}</div> : <EmptyState title="No hay alumnos en este grupo" description="Agrega un alumno con los datos mínimos para planear." action={<Link className="button" href={`/dashboard/students/new?groupId=${group.id}`}>Agregar alumno</Link>}/>}</section>
    <details className="card p-6"><summary className="cursor-pointer font-extrabold">Editar datos del grupo</summary><GroupForm initial={group}/></details>
  </div>;
}
