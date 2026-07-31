"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { groupSchema } from "@/lib/schemas/domain";
import { requireUser } from "@/lib/permissions/auth";
import type { ActionState } from "./auth";

export async function createGroupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = groupSchema.safeParse({ name: formData.get("name"), educationalLevel: formData.get("educationalLevel"), academicGrade: formData.get("academicGrade"), schoolCycle: formData.get("schoolCycle") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.schema("app").from("groups").insert({ educator_id: user.id, name: parsed.data.name, educational_level: parsed.data.educationalLevel, academic_grade: parsed.data.academicGrade, school_cycle: parsed.data.schoolCycle || null }).select("id").single();
  if (error) return { error: error.message };
  redirect(`/dashboard/groups/${data.id}`);
}

export async function updateGroupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const groupId = String(formData.get("groupId"));
  const parsed = groupSchema.safeParse({ name: formData.get("name"), educationalLevel: formData.get("educationalLevel"), academicGrade: formData.get("academicGrade"), schoolCycle: formData.get("schoolCycle") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase, user } = await requireUser();
  const { error } = await supabase.schema("app").from("groups").update({ name: parsed.data.name, educational_level: parsed.data.educationalLevel, academic_grade: parsed.data.academicGrade, school_cycle: parsed.data.schoolCycle || null }).eq("id", groupId).eq("educator_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/groups/${groupId}`);
  return { success: "Grupo actualizado." };
}
