import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { RecommendationFeedback } from "@/components/recommendations/recommendation-feedback";
import type { RecommendationRating } from "@/types/database";

type Row = {
  id: string;
  content: string;
  model: string;
  rating: RecommendationRating | null;
  comment: string | null;
  created_at: string;
  regenerated_from: string | null;
  students: { id: string; name: string; grade: number } | null;
  subjects: { category: string; topic: string; learning_objective: string | null } | null;
};

export default async function RecommendationPage({ params }: { params: Promise<{ recommendationId: string }> }) {
  const { recommendationId } = await params;
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("recommendations")
    .select("id,content,model,rating,comment,created_at,regenerated_from,students(id,name,grade),subjects(category,topic,learning_objective)")
    .eq("id", recommendationId)
    .maybeSingle();
  const recommendation = data as unknown as Row | null;
  if (!recommendation) notFound();

  const { students: student, subjects: subject } = recommendation;

  return <div className="grid gap-8">
    <PageHeader
      eyebrow={subject ? `${subject.category} · ${subject.topic}` : "Recomendación"}
      title={student ? `Para ${student.name}` : "Recomendación"}
      description={subject?.learning_objective ?? undefined}
      action={student && <Link className="button button-secondary" href={`/dashboard/students/${student.id}`}><ArrowLeft size={17}/>Volver al alumno</Link>}
    />

    {recommendation.regenerated_from && (
      <p className="muted text-sm">
        Esta recomendación reemplaza a <Link className="brand-link" href={`/dashboard/recommendations/${recommendation.regenerated_from}`}>una anterior</Link> que descartaste.
      </p>
    )}

    <article className="card p-6 sm:p-8">
      <p className="whitespace-pre-wrap leading-relaxed">{recommendation.content}</p>
      <p className="muted mt-6 text-xs">
        Generada por {recommendation.model} el {new Date(recommendation.created_at).toLocaleDateString("es-MX", { dateStyle: "long" })}.
        Es una propuesta: requiere tu revisión antes de aplicarse en el aula.
      </p>
    </article>

    <RecommendationFeedback recommendationId={recommendation.id} rating={recommendation.rating} comment={recommendation.comment}/>
  </div>;
}
