"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions/auth";
import { feedbackSchema, recommendationRequestSchema } from "@/lib/schemas/domain";
import type { ActionState } from "./auth";

/**
 * La recomendación la escribe la Edge Function con service_role, no el cliente:
 * lo que produce el modelo no debe poder falsificarse desde el navegador.
 */
async function generate(body: { studentId: string; subjectId: string; refinement?: string; regeneratedFrom?: string }) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.functions.invoke<{ recommendationId: string }>("generate-recommendation", { body });
  if (error) return { error: error.message };
  if (!data?.recommendationId) return { error: "La generación no devolvió una recomendación." };
  return { recommendationId: data.recommendationId };
}

export async function requestRecommendationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = recommendationRequestSchema.safeParse({
    studentId: formData.get("studentId"),
    subjectId: formData.get("subjectId"),
    refinement: String(formData.get("refinement") ?? "").trim() || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const result = await generate(parsed.data);
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/recommendations/${result.recommendationId}`);
}

/**
 * Regenerar encadena: la nueva recomendación apunta a la rechazada mediante
 * regenerated_from, y el motivo viaja al prompt para que el modelo no repita
 * lo que el educador acaba de descartar.
 */
export async function regenerateRecommendationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const previousId = String(formData.get("recommendationId"));
  const { supabase } = await requireUser();
  const { data: previous, error } = await supabase
    .from("recommendations")
    .select("student_id, subject_id, comment")
    .eq("id", previousId)
    .single();
  if (error || !previous) return { error: "No encontramos la recomendación anterior." };

  const refinement = String(formData.get("refinement") ?? "").trim() || previous.comment || undefined;
  const result = await generate({
    studentId: previous.student_id,
    subjectId: previous.subject_id,
    refinement: refinement?.slice(0, 300),
    regeneratedFrom: previousId,
  });
  if ("error" in result) return { error: result.error };
  redirect(`/dashboard/recommendations/${result.recommendationId}`);
}

export async function rateRecommendationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({
    recommendationId: formData.get("recommendationId"),
    rating: formData.get("rating"),
    comment: String(formData.get("comment") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase } = await requireUser();
  // rated_at y rating van juntos: el check de la base rechaza uno sin el otro.
  const { error } = await supabase
    .from("recommendations")
    .update({ rating: parsed.data.rating, comment: parsed.data.comment, rated_at: new Date().toISOString() })
    .eq("id", parsed.data.recommendationId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/recommendations/${parsed.data.recommendationId}`);
  return {
    success: parsed.data.rating === "good"
      ? "Guardada. Se usará como ejemplo en próximas recomendaciones."
      : "Guardada. Puedes generar una nueva con este motivo.",
  };
}
