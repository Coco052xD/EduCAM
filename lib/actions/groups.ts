"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { groupSchema } from "@/lib/schemas/domain";
import { requireUser } from "@/lib/permissions/auth";
import type { ActionState } from "./auth";

function groupFromForm(formData: FormData) {
  return groupSchema.safeParse({
    name: formData.get("name"),
    grade: formData.get("grade"),
    schoolYear: formData.get("schoolYear"),
  });
}

export async function createGroupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = groupFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("student_groups")
    .insert({ name: parsed.data.name, grade: parsed.data.grade, school_year: parsed.data.schoolYear })
    .select("id")
    .single();
  if (error) return { error: error.message };
  redirect(`/dashboard/groups/${data.id}`);
}

export async function updateGroupAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const groupId = String(formData.get("groupId"));
  const parsed = groupFromForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("student_groups")
    .update({ name: parsed.data.name, grade: parsed.data.grade, school_year: parsed.data.schoolYear })
    .eq("id", groupId);
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/groups/${groupId}`);
  return { success: "Grupo actualizado." };
}
