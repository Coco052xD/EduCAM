import { notFound } from "next/navigation";
import { generateAlternativeAction, retryGenerationAction } from "@/lib/actions/activities";
import { generatedActivitySchema } from "@/lib/schemas/activity";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { ActivityCard } from "@/components/activities/activity-card";

const refinements = ["Hacerla más sencilla","Hacerla más dinámica","Reducir duración","Usar menos materiales","Cambiar tipo de actividad","Mejorar adaptaciones","Generar una alternativa diferente"];
export default async function ActivityRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: request }, { data: options }] = await Promise.all([
    app.from("activity_requests").select("*").eq("id", requestId).eq("educator_id", user.id).maybeSingle(),
    app.from("activity_options").select("*").eq("activity_request_id", requestId).order("generation_number"),
  ]);
  if (!request) notFound();
  const [{ data: subject }, { data: topic }] = await Promise.all([
    supabase.schema("curriculum").from("subjects").select("name").eq("id", request.subject_id).maybeSingle(),
    supabase.schema("curriculum").from("topics").select("name,learning_objective").eq("id", request.topic_id).maybeSingle(),
  ]);
  const validOptions = (options ?? []).flatMap((option) => { const parsed = generatedActivitySchema.safeParse(option.activity_data); return parsed.success ? [{ option, activity: parsed.data }] : []; });
  return <div className="grid gap-8"><PageHeader eyebrow={subject?.name ?? "Propuestas"} title={topic?.name ?? "Opciones generadas"} description={topic?.learning_objective}/>
    {request.status === "failed" && <div className="alert alert-error"><strong>No pudimos generar las propuestas.</strong><p className="mt-1">{request.error_message || "La solicitud se conservó para que puedas reintentar."}</p><form action={retryGenerationAction} className="mt-4"><input type="hidden" name="requestId" value={request.id}/><button className="button" type="submit">Reintentar</button></form></div>}
    {request.status === "rate_limited" && <div className="alert alert-error">Alcanzaste el límite técnico temporal. La solicitud se conservó; vuelve a intentar más tarde.</div>}
    {validOptions.map(({option,activity}) => <ActivityCard key={option.id} optionId={option.id} requestId={request.id} status={option.status} rating={option.pre_application_rating} activity={activity}/>) }
    {validOptions.length === 0 && request.status !== "failed" && <div className="card p-8 text-center"><div className="skeleton mx-auto h-8 w-2/3"/><p className="muted mt-5">La generación puede tardar unos segundos. Actualiza la página si continúa.</p></div>}
    {validOptions.length > 0 && <section className="no-print card p-6"><h2 className="font-extrabold">¿Quieres otra dirección?</h2><p className="muted mt-2 text-sm">La alternativa considerará las propuestas anteriores y evitará repetirlas sustancialmente.</p><div className="mt-4 flex flex-wrap gap-2">{refinements.map((refinement) => <form action={generateAlternativeAction} key={refinement}><input type="hidden" name="requestId" value={request.id}/><input type="hidden" name="refinement" value={refinement}/><button className="button button-secondary" type="submit">{refinement}</button></form>)}</div></section>}
  </div>;
}
