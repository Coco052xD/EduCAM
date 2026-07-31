"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, educatorProfileSchema } from "@/lib/schemas/auth";

export type ActionState = { error?: string; success?: string };

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "No pudimos iniciar sesión. Revisa tus datos." };
  redirect("/dashboard");
}

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(parsed.data);
  if (error) return { error: error.message };
  if (!data.session) return { success: "Revisa tu correo para confirmar la cuenta." };
  redirect("/onboarding");
}

export async function forgotPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const parsed = credentialsSchema.shape.email.safeParse(email);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  return error ? { error: error.message } : { success: "Si existe una cuenta, recibirás instrucciones por correo." };
}

export async function updatePasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const password = credentialsSchema.shape.password.safeParse(formData.get("password"));
  if (!password.success) return { error: password.error.issues[0]?.message };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Abre nuevamente el enlace de recuperación." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function saveEducatorProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró." };
  const parsed = educatorProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    gradesTaught: formData.getAll("gradesTaught"),
    subjectsTaught: formData.getAll("subjectsTaught"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { error } = await supabase.schema("app").from("educator_profiles").upsert({
    user_id: user.id, display_name: parsed.data.displayName,
    grades_taught: parsed.data.gradesTaught, subjects_taught: parsed.data.subjectsTaught,
  });
  if (error) return { error: error.message };
  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
