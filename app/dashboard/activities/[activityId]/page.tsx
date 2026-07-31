import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { generatedActivitySchema } from "@/lib/schemas/activity";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityLifecycle } from "@/components/activities/activity-lifecycle";

export default async function ActivityPage({ params }: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const { data: option } = await app.from("activity_options").select("*,activity_requests!inner(educator_id)").eq("id", activityId).eq("activity_requests.educator_id", user.id).maybeSingle();
  if (!option) notFound();
  const parsed = generatedActivitySchema.safeParse(option.activity_data);
  if (!parsed.success) notFound();
  const activity = parsed.data;
  const { data: feedback } = await app.from("activity_feedback").select("rating,modification_comment").eq("activity_option_id", activityId).maybeSingle();
  return <div className="grid gap-8"><PageHeader eyebrow="Actividad seleccionada" title={activity.title} description={activity.objective}/><div className="grid items-start gap-6 xl:grid-cols-[1fr_350px]"><article className="card overflow-hidden"><div className="flex flex-wrap gap-2 border-b border-[#dce4df] p-6"><span className="chip capitalize">{activity.activityType}</span><span className="chip">{activity.durationMinutes} minutos</span></div><div className="grid gap-7 p-6 sm:p-8"><section><h2 className="section-title">Materiales</h2><ul className="mt-3 list-disc space-y-1 pl-5">{activity.materials.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2 className="section-title">Preparación</h2><ul className="mt-3 list-disc space-y-1 pl-5">{activity.preparation.map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2 className="section-title">Desarrollo</h2><ol className="mt-4 space-y-5">{activity.steps.map((step) => <li key={`${step.order}-${step.instruction}`}><p className="font-bold">{step.order}. {step.instruction}</p><p className="muted mt-1 text-sm">Tiempo: {step.estimatedMinutes} min · Apoyo docente: {step.educatorSupport}</p></li>)}</ol></section><section><h2 className="section-title">Adaptaciones</h2><div className="mt-4 grid gap-3">{activity.studentAdaptations.map((item) => <div className="rounded-xl bg-[#edf6f1] p-4" key={item.studentKey}><p className="font-bold">{item.studentKey}</p><ul className="muted mt-2 list-disc pl-5 text-sm">{item.recommendations.map((rec) => <li key={rec}>{rec}</li>)}</ul></div>)}</div></section><section><h2 className="section-title">Evaluación formativa</h2><p className="mt-3"><strong>Evidencias:</strong> {activity.assessment.evidence.join(" · ")}</p><p className="mt-2"><strong>Criterios:</strong> {activity.assessment.observationCriteria.join(" · ")}</p><p className="mt-2"><strong>Opciones de respuesta:</strong> {activity.assessment.responseOptions.join(" · ")}</p></section><section className="rounded-xl bg-[#fff8eb] p-5"><h2 className="font-extrabold">Revisión del educador</h2><p className="mt-2 text-sm">{activity.rationale}</p>{activity.safetyNotes.length > 0 && <p className="muted mt-3 text-xs">Notas: {activity.safetyNotes.join(" · ")}</p>}</section></div></article><ActivityLifecycle optionId={activityId} status={option.status} activity={activity} existingFeedback={feedback}/></div></div>;
}
