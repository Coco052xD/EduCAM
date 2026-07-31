"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions/auth";
import { learningProfileSchema, studentSchema } from "@/lib/schemas/domain";
import type { ActionState } from "./auth";

function studentFromForm(formData: FormData) {
  const ageRaw = String(formData.get("ageValue") ?? "").trim();
  const rangeRaw = String(formData.get("ageRange") ?? "").trim();
  return studentSchema.safeParse({
    groupId: formData.get("groupId"), nickname: formData.get("nickname"),
    ageValue: ageRaw ? Number(ageRaw) : null, ageRange: rangeRaw || null,
    educationalLevel: formData.get("educationalLevel"), enrolledGrade: formData.get("enrolledGrade"),
    conditionIds: formData.getAll("conditionIds"),
  });
}

export async function createStudentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = studentFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const payload = parsed.data;
  const { data, error } = await supabase.schema("app").from("students").insert({
    educator_id: user.id, group_id: payload.groupId, nickname: payload.nickname,
    age_value: payload.ageValue, age_range: payload.ageRange,
    educational_level: payload.educationalLevel, enrolled_grade: payload.enrolledGrade,
  }).select("id").single();
  if (error) return { error: error.message };
  const { error: conditionError } = await supabase.schema("app").from("student_conditions").insert(payload.conditionIds.map((conditionId) => ({ student_id: data.id, condition_id: conditionId })));
  if (conditionError) {
    await supabase.schema("app").from("students").delete().eq("id", data.id);
    return { error: conditionError.message };
  }
  redirect(`/dashboard/students/${data.id}/learning-profile`);
}

export async function updateStudentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = String(formData.get("studentId"));
  const parsed = studentFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const payload = parsed.data;
  const { error } = await supabase.schema("app").from("students").update({
    group_id: payload.groupId, nickname: payload.nickname, age_value: payload.ageValue, age_range: payload.ageRange,
    educational_level: payload.educationalLevel, enrolled_grade: payload.enrolledGrade,
  }).eq("id", studentId).eq("educator_id", user.id);
  if (error) return { error: error.message };
  await supabase.schema("app").from("student_conditions").delete().eq("student_id", studentId);
  const { error: conditionError } = await supabase.schema("app").from("student_conditions").insert(payload.conditionIds.map((conditionId) => ({ student_id: studentId, condition_id: conditionId })));
  if (conditionError) return { error: conditionError.message };
  revalidatePath(`/dashboard/students/${studentId}`);
  redirect(`/dashboard/students/${studentId}`);
}

export async function saveLearningProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = learningProfileSchema.safeParse({
    studentId: formData.get("studentId"),
    preferredInstructionFormats: formData.getAll("preferredInstructionFormats"),
    instructionSteps: formData.get("instructionSteps"), preferredParticipation: formData.get("preferredParticipation"),
    attentionRange: formData.get("attentionRange"), needsBreaks: formData.get("needsBreaks"),
    responseMethods: formData.getAll("responseMethods"), interests: formData.getAll("interests"),
    preferredMaterials: formData.getAll("preferredMaterials"), successfulSupports: formData.getAll("successfulSupports"),
    educatorNote: String(formData.get("educatorNote") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { data: ownedStudent } = await supabase.schema("app").from("students").select("id").eq("id", parsed.data.studentId).eq("educator_id", user.id).single();
  if (!ownedStudent) return { error: "No encontramos al alumno o no tienes acceso." };
  const d = parsed.data;
  const { error } = await supabase.schema("app").from("learning_profiles").upsert({
    student_id: d.studentId, preferred_instruction_formats: d.preferredInstructionFormats,
    instruction_steps: d.instructionSteps, preferred_participation: d.preferredParticipation,
    attention_range: d.attentionRange, needs_breaks: d.needsBreaks, response_methods: d.responseMethods,
    interests: d.interests, preferred_materials: d.preferredMaterials, successful_supports: d.successfulSupports,
    educator_note: d.educatorNote,
  }, { onConflict: "student_id" });
  if (error) return { error: error.message };
  redirect(`/dashboard/students/${d.studentId}`);
}
