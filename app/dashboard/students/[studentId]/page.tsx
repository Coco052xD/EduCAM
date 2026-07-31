import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpenCheck, Pencil, Sparkles } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";

type AnswerRow = { profile_questions: { question: string; sort_order: number } | null; profile_options: { label: string } | null };

export default async function StudentPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase } = await requireUser();
  const [{ data: student }, { data: answers }, { data: links }, { data: membership }] = await Promise.all([
    supabase.from("students").select("id,name,grade,age_range,profile_comment").eq("id", studentId).maybeSingle(),
    supabase
      .from("student_profile_answers")
      .select("profile_questions(question,sort_order),profile_options(label)")
      .eq("student_id", studentId),
    supabase.from("student_conditions").select("conditions(id,name)").eq("student_id", studentId),
    supabase.from("student_group_members").select("student_groups(name)").eq("student_id", studentId).maybeSingle(),
  ]);
  if (!student) notFound();

  const conditions = ((links ?? []) as unknown as { conditions: { id: string; name: string } | null }[])
    .map((row) => row.conditions)
    .filter((condition): condition is { id: string; name: string } => Boolean(condition));
  const profile = ((answers ?? []) as unknown as AnswerRow[])
    .filter((row) => row.profile_questions && row.profile_options)
    .sort((a, b) => (a.profile_questions!.sort_order ?? 0) - (b.profile_questions!.sort_order ?? 0));
  const groupName = (membership as unknown as { student_groups: { name: string } | null } | null)?.student_groups?.name;

  return <div className="grid gap-8"><PageHeader eyebrow={groupName ?? "Alumno"} title={student.name} description={`${student.age_range} años · ${student.grade}.º de primaria`} action={<div className="flex flex-wrap gap-2"><Link className="button button-secondary" href={`/dashboard/students/${student.id}/edit`}><Pencil size={17}/>Editar</Link><Link className="button button-secondary" href={`/dashboard/students/${student.id}/learning-profile`}><BookOpenCheck size={17}/>{profile.length ? "Actualizar perfil" : "Completar perfil"}</Link><Link className="button" href={`/dashboard/recommendations/new?studentId=${student.id}`}><Sparkles size={17}/>Recomendación</Link></div>}/>
    <section className="grid gap-5 md:grid-cols-2">
      <div className="card p-6"><h2 className="section-title">Padecimientos</h2><div className="mt-4 flex flex-wrap gap-2">{conditions.map((condition) => <span className="chip" key={condition.id}>{condition.name}</span>)}</div><p className="muted mt-5 text-xs">Contextualizan la recomendación; el perfil de aprendizaje pesa más.</p></div>
      <div className="card p-6"><h2 className="section-title">Perfil de aprendizaje</h2>{profile.length ? <dl className="mt-4 grid gap-3">{profile.map((row) => <div key={row.profile_questions!.question}><dt className="text-sm font-bold">{row.profile_questions!.question}</dt><dd className="muted text-sm">{row.profile_options!.label}</dd></div>)}</dl> : <p className="muted mt-4">Aún no está completo. Es necesario antes de generar recomendaciones para este alumno.</p>}
        {student.profile_comment && <><p className="mt-5 font-bold">Comentario del educador</p><p className="muted mt-1 text-sm">{student.profile_comment}</p></>}
      </div>
    </section>
  </div>;
}
