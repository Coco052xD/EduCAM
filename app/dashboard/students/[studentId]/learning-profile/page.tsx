import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LearningProfileForm } from "@/components/students/learning-profile-form";
import type { ProfileOption, ProfileQuestionWithOptions } from "@/types/database";

export default async function LearningProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase } = await requireUser();
  // El formulario se arma desde la base: agregar una pregunta no toca el código.
  const [{ data: student }, { data: questions }, { data: options }, { data: answers }] = await Promise.all([
    supabase.from("students").select("id,name").eq("id", studentId).maybeSingle(),
    supabase.from("profile_questions").select("id,question,help_text,sort_order,active").eq("active", true).order("sort_order"),
    supabase.from("profile_options").select("id,question_id,label,sort_order").order("sort_order"),
    supabase.from("student_profile_answers").select("question_id,option_id").eq("student_id", studentId),
  ]);
  if (!student) notFound();

  const byQuestion = new Map<string, ProfileOption[]>();
  for (const option of (options ?? []) as ProfileOption[]) {
    byQuestion.set(option.question_id, [...(byQuestion.get(option.question_id) ?? []), option]);
  }
  const form: ProfileQuestionWithOptions[] = (questions ?? []).map((question) => ({
    ...question,
    options: byQuestion.get(question.id) ?? [],
  }));
  const initial = Object.fromEntries((answers ?? []).map((answer) => [answer.question_id, answer.option_id]));

  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Perfil de aprendizaje" title={`Cómo aprende ${student.name}`} description="Registra preferencias observables, intereses y apoyos educativos. No es una evaluación psicológica ni clínica."/><LearningProfileForm studentId={student.id} questions={form} initial={initial}/></div>;
}
