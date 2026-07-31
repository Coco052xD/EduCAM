import { notFound } from "next/navigation";
import { requireUser } from "@/lib/permissions/auth";
import { PageHeader } from "@/components/ui/page-header";
import { LearningProfileForm } from "@/components/students/learning-profile-form";

export default async function LearningProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { supabase, user } = await requireUser();
  const app = supabase.schema("app");
  const [{ data: student }, { data: profile }] = await Promise.all([
    app.from("students").select("id,nickname").eq("id", studentId).eq("educator_id", user.id).maybeSingle(),
    app.from("learning_profiles").select("*").eq("student_id", studentId).maybeSingle(),
  ]);
  if (!student) notFound();
  const initial = profile ? {
    preferredInstructionFormats: profile.preferred_instruction_formats,
    instructionSteps: profile.instruction_steps,
    preferredParticipation: profile.preferred_participation,
    attentionRange: profile.attention_range,
    needsBreaks: profile.needs_breaks,
    responseMethods: profile.response_methods,
    interests: profile.interests,
    preferredMaterials: profile.preferred_materials,
    successfulSupports: profile.successful_supports,
    educatorNote: profile.educator_note,
  } : {};
  return <div className="mx-auto max-w-4xl"><PageHeader eyebrow="Perfil de aprendizaje" title={`Cómo aprende ${student.nickname}`} description="Registra preferencias observables, intereses y apoyos educativos. No es una evaluación psicológica ni clínica."/><LearningProfileForm studentId={student.id} initial={initial}/></div>;
}
