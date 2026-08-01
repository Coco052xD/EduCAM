"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/permissions/auth";
import { learningProfileSchema, studentSchema } from "@/lib/schemas/domain";
import type { ActionState } from "./auth";

function studentFromForm(formData: FormData) {
  return studentSchema.safeParse({
    name: formData.get("name"),
    grade: formData.get("grade"),
    ageRange: formData.get("ageRange"),
    groupId: formData.get("groupId"),
    conditionIds: formData.getAll("conditionIds"),
    profileComment: String(formData.get("profileComment") ?? "").trim() || null,
  });
}

export async function createStudentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = studentFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireUser();
  const payload = parsed.data;

  const { data, error } = await supabase
    .from("students")
    .insert({ name: payload.name, grade: payload.grade, age_range: payload.ageRange, profile_comment: payload.profileComment })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Sin transacción, un fallo aquí dejaría un alumno sin grupo ni padecimientos.
  // El borrado compensatorio evita ese huérfano.
  const [{ error: memberError }, { error: conditionError }] = await Promise.all([
    supabase.from("student_group_members").insert({ group_id: payload.groupId, student_id: data.id }),
    supabase.from("student_conditions").insert(payload.conditionIds.map((conditionId) => ({ student_id: data.id, condition_id: conditionId }))),
  ]);
  if (memberError || conditionError) {
    await supabase.from("students").delete().eq("id", data.id);
    return { error: (memberError ?? conditionError)!.message };
  }
  redirect(`/dashboard/students/${data.id}/learning-profile`);
}

export async function updateStudentAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = String(formData.get("studentId"));
  const parsed = studentFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireUser();
  const payload = parsed.data;

  const { error } = await supabase
    .from("students")
    .update({ name: payload.name, grade: payload.grade, age_range: payload.ageRange, profile_comment: payload.profileComment })
    .eq("id", studentId);
  if (error) return { error: error.message };

  await Promise.all([
    supabase.from("student_group_members").delete().eq("student_id", studentId),
    supabase.from("student_conditions").delete().eq("student_id", studentId),
  ]);
  const [{ error: memberError }, { error: conditionError }] = await Promise.all([
    supabase.from("student_group_members").insert({ group_id: payload.groupId, student_id: studentId }),
    supabase.from("student_conditions").insert(payload.conditionIds.map((conditionId) => ({ student_id: studentId, condition_id: conditionId }))),
  ]);
  if (memberError || conditionError) return { error: (memberError ?? conditionError)!.message };

  revalidatePath(`/dashboard/students/${studentId}`);
  redirect(`/dashboard/students/${studentId}`);
}

/**
 * El formulario es dinámico: cada campo del FormData se llama como el uuid de
 * la pregunta y su valor es el uuid de la opción elegida.
 */
export async function saveLearningProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const studentId = String(formData.get("studentId"));
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "studentId" || typeof value !== "string" || !value) continue;
    answers[key] = value;
  }

  const parsed = learningProfileSchema.safeParse({ studentId, answers });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { supabase } = await requireUser();
  const rows = Object.entries(parsed.data.answers).map(([questionId, optionId]) => ({
    student_id: parsed.data.studentId,
    question_id: questionId,
    option_id: optionId,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("student_profile_answers").upsert(rows, { onConflict: "student_id,question_id" });
  if (error) return { error: error.message };

  redirect(`/dashboard/students/${parsed.data.studentId}`);
}
