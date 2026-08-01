import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { RecommendationForm } from "@/components/recommendations/recommendation-form";
import type { Subject } from "@/types/database";

export default async function NewRecommendationPage({ searchParams }: { searchParams: Promise<{ studentId?: string }> }) {
  const { studentId } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: students }, { data: subjects }] = await Promise.all([
    supabase.from("students").select("id,name,grade,student_profile_answers(count)").eq("active", true).order("name"),
    supabase.from("subjects").select("id,category,topic,grade,learning_objective").order("category").order("topic"),
  ]);

  const options = (students ?? []).map((student) => ({
    id: student.id as string,
    name: student.name as string,
    grade: student.grade as number,
    hasProfile: ((student.student_profile_answers as unknown as { count: number }[])?.[0]?.count ?? 0) > 0,
  }));

  return <div className="mx-auto max-w-3xl">
    <PageHeader eyebrow="Nueva recomendación" title="Cómo dar este tema a este alumno" description="Gemma cruza el perfil de aprendizaje, los padecimientos, el grado y el tema. El perfil pesa más que el padecimiento."/>
    <RecommendationForm students={options} subjects={(subjects ?? []) as Subject[]} selectedStudentId={studentId}/>
  </div>;
}
