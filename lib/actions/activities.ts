"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions/auth";
import { activityRequestSchema, feedbackSchema } from "@/lib/schemas/domain";
import { generatedActivitySchema } from "@/lib/schemas/activity";
import type { ActionState } from "./auth";

async function invokeGenerator(requestId: string, refinement?: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.functions.invoke("generate-activity", { body: { requestId, refinement } });
  if (error) {
    await supabase.schema("app").from("activity_requests").update({ status: "failed", error_message: error.message }).eq("id", requestId);
    return error.message;
  }
}

export async function createActivityRequestAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const durationRaw = String(formData.get("durationMinutes") ?? "").trim();
  const parsed = activityRequestSchema.safeParse({
    groupId: formData.get("groupId"), subjectId: formData.get("subjectId"), topicId: formData.get("topicId"),
    selectedStudentIds: formData.getAll("selectedStudentIds"),
    durationMinutes: durationRaw ? Number(durationRaw) : null,
    availableMaterials: String(formData.get("availableMaterials") ?? "").split(",").map((value) => value.trim()).filter(Boolean),
    extraInstructions: String(formData.get("extraInstructions") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const d = parsed.data;
  const { data, error } = await supabase.schema("app").from("activity_requests").insert({
    educator_id: user.id, group_id: d.groupId, subject_id: d.subjectId, topic_id: d.topicId,
    selected_student_ids: d.selectedStudentIds, duration_minutes: d.durationMinutes,
    available_materials: d.availableMaterials, extra_instructions: d.extraInstructions, status: "pending",
  }).select("id").single();
  if (error) return { error: error.message };
  await invokeGenerator(data.id);
  redirect(`/dashboard/activities/requests/${data.id}`);
}

export async function retryGenerationAction(formData: FormData) {
  const requestId = String(formData.get("requestId"));
  await invokeGenerator(requestId, String(formData.get("refinement") ?? "Reintentar la generación"));
  revalidatePath(`/dashboard/activities/requests/${requestId}`);
}

export async function discardAndRegenerateAction(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const requestId = String(formData.get("requestId"));
  const reason = String(formData.get("discardReason") ?? "").slice(0, 300);
  const { supabase } = await requireUser();
  const { error } = await supabase.schema("app").from("activity_options").update({ status: "discarded", discard_reason: reason }).eq("id", optionId);
  if (!error) await invokeGenerator(requestId, `Motivo de descarte: ${reason}`);
  revalidatePath(`/dashboard/activities/requests/${requestId}`);
}

export async function generateAlternativeAction(formData: FormData) {
  const requestId = String(formData.get("requestId"));
  const refinement = String(formData.get("refinement") ?? "Generar una alternativa diferente").slice(0, 300);
  await invokeGenerator(requestId, refinement);
  revalidatePath(`/dashboard/activities/requests/${requestId}`);
}

export async function ratePreApplicationAction(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const requestId = String(formData.get("requestId"));
  const rating = Number(formData.get("rating"));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  const { supabase } = await requireUser();
  await supabase.schema("app").from("activity_options").update({ pre_application_rating: rating }).eq("id", optionId);
  revalidatePath(`/dashboard/activities/requests/${requestId}`);
}

export async function acceptActivityAction(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const { supabase } = await requireUser();
  const { error } = await supabase.schema("app").from("activity_options").update({ status: "accepted" }).eq("id", optionId).in("status", ["generated", "edited"]);
  if (!error) redirect(`/dashboard/activities/${optionId}`);
}

export async function editAndAcceptActivityAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const optionId = String(formData.get("optionId"));
  const { supabase } = await requireUser();
  const { data: option, error: readError } = await supabase.schema("app").from("activity_options").select("activity_data").eq("id", optionId).single();
  if (readError) return { error: "No pudimos abrir la actividad." };
  const current = generatedActivitySchema.safeParse(option.activity_data);
  if (!current.success) return { error: "La actividad guardada no tiene un formato válido." };
  const edited = generatedActivitySchema.safeParse({ ...current.data, title: formData.get("title"), objective: formData.get("objective"), rationale: formData.get("rationale") });
  if (!edited.success) return { error: edited.error.issues[0]?.message };
  const { error } = await supabase.schema("app").from("activity_options").update({ activity_data: edited.data, status: "edited" }).eq("id", optionId);
  if (error) return { error: error.message };
  redirect(`/dashboard/activities/${optionId}`);
}

export async function markAppliedAction(formData: FormData) {
  const optionId = String(formData.get("optionId"));
  const { supabase } = await requireUser();
  await supabase.schema("app").rpc("mark_activity_applied", { option_id: optionId });
  revalidatePath(`/dashboard/activities/${optionId}`);
}

export async function saveFeedbackAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = feedbackSchema.safeParse({ activityOptionId: formData.get("optionId"), rating: Number(formData.get("rating")), modificationComment: formData.get("modificationComment") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireUser();
  const { error } = await supabase.schema("app").rpc("save_activity_feedback", { option_id: parsed.data.activityOptionId, stars: parsed.data.rating, comment: parsed.data.modificationComment });
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/activities/${parsed.data.activityOptionId}`);
  return { success: "Retroalimentación guardada. Se considerará en futuras propuestas." };
}
