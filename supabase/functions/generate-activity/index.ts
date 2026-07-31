import { createClient } from "@supabase/supabase-js";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requestSchema } from "../_shared/schemas.ts";
import { buildPrompt } from "../_shared/prompts.ts";
import { callGemma } from "../_shared/gemma.ts";
import { anonymizeStudents, assertNoNicknames, summarizeFeedback, type StudentRow } from "../_shared/safety.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let requestId: string | undefined;
  let admin: ReturnType<typeof createClient> | undefined;
  try {
    if (request.method !== "POST") return jsonResponse({ error: "Método no permitido." }, 405);
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Usuario no autenticado." }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado.");

    const jwt = authorization.slice(7);
    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(jwt);
    if (authError || !user) return jsonResponse({ error: "Sesión inválida." }, 401);
    admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const parsedBody = requestSchema.parse(await request.json());
    requestId = parsedBody.requestId;
    const { data: activityRequest, error: requestError } = await admin.schema("app").from("activity_requests").select("*").eq("id", requestId).eq("educator_id", user.id).maybeSingle();
    if (requestError || !activityRequest) return jsonResponse({ error: "Solicitud no encontrada o sin acceso." }, 404);

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const limit = Number(Deno.env.get("GENERATION_LIMIT_PER_HOUR") ?? "12");
    const { count } = await admin.schema("app").from("audit_logs").select("id", { count: "exact", head: true }).eq("educator_id", user.id).eq("action", "activity.generated").gte("created_at", hourAgo);
    if ((count ?? 0) >= limit) {
      await admin.schema("app").from("activity_requests").update({ status: "rate_limited", error_message: "Límite temporal alcanzado." }).eq("id", requestId);
      return jsonResponse({ error: "Límite técnico de generación alcanzado." }, 429);
    }
    await admin.schema("app").from("activity_requests").update({ status: "generating", error_message: null }).eq("id", requestId);

    const studentIds = activityRequest.selected_student_ids as string[];
    const [{ data: students }, { data: profiles }, { data: conditionLinks }, { data: subject }, { data: topic }] = await Promise.all([
      admin.schema("app").from("students").select("id,nickname,age_value,age_range,educational_level,enrolled_grade").in("id", studentIds).eq("educator_id", user.id).eq("group_id", activityRequest.group_id).eq("active", true),
      admin.schema("app").from("learning_profiles").select("*").in("student_id", studentIds),
      admin.schema("app").from("student_conditions").select("student_id,condition_id").in("student_id", studentIds),
      admin.schema("curriculum").from("subjects").select("id,name,formative_field,educational_level,academic_grade,curriculum_version").eq("id", activityRequest.subject_id).eq("active", true).maybeSingle(),
      admin.schema("curriculum").from("topics").select("id,subject_id,name,learning_objective,source_reference").eq("id", activityRequest.topic_id).eq("subject_id", activityRequest.subject_id).eq("active", true).maybeSingle(),
    ]);
    if (!students || students.length !== studentIds.length) throw new Error("Uno o más alumnos no pertenecen al educador o al grupo.");
    if (!profiles || profiles.length !== students.length) throw new Error("Todos los alumnos seleccionados deben tener un Perfil de aprendizaje completo.");
    if (!subject || !topic) throw new Error("Materia o tema curricular no encontrado.");

    const conditionIds = [...new Set((conditionLinks ?? []).map((item) => item.condition_id))];
    const [{ data: conditions }, { data: recommendations }] = await Promise.all([
      conditionIds.length ? admin.schema("knowledge").from("conditions").select("id,name").in("id", conditionIds).eq("active", true) : Promise.resolve({ data: [] }),
      conditionIds.length ? admin.schema("knowledge").from("recommendations").select("condition_id,category,recommendation,applicability,do_not_assume").in("condition_id", conditionIds).eq("validation_status", "approved") : Promise.resolve({ data: [] }),
    ]);
    if (!recommendations?.length) throw new Error("No hay recomendaciones pedagógicas aprobadas para la selección.");

    const conditionName = new Map((conditions ?? []).map((item) => [item.id, item.name]));
    const profilesByStudent = new Map((profiles ?? []).map((profile) => [profile.student_id, {
      preferredInstructionFormats: profile.preferred_instruction_formats, instructionSteps: profile.instruction_steps,
      preferredParticipation: profile.preferred_participation, attentionRange: profile.attention_range,
      needsBreaks: profile.needs_breaks, responseMethods: profile.response_methods, interests: profile.interests,
      preferredMaterials: profile.preferred_materials, successfulSupports: profile.successful_supports,
      educatorNote: profile.educator_note,
    }]));
    const conditionsByStudent = new Map<string, string[]>();
    for (const link of conditionLinks ?? []) conditionsByStudent.set(link.student_id, [...(conditionsByStudent.get(link.student_id) ?? []), conditionName.get(link.condition_id) ?? "Condición seleccionada"]);
    const anonymousStudents = anonymizeStudents(students as StudentRow[], profilesByStudent, conditionsByStudent);

    const { data: relatedRequests } = await admin.schema("app").from("activity_requests").select("id").eq("educator_id", user.id).or(`group_id.eq.${activityRequest.group_id},subject_id.eq.${activityRequest.subject_id},topic_id.eq.${activityRequest.topic_id}`).order("created_at", { ascending: false }).limit(25);
    const relatedIds = (relatedRequests ?? []).map((item) => item.id);
    const { data: relatedOptions } = relatedIds.length ? await admin.schema("app").from("activity_options").select("id").in("activity_request_id", relatedIds).in("status", ["applied","evaluated"]) : { data: [] };
    const optionIds = (relatedOptions ?? []).map((item) => item.id);
    const { data: feedback } = optionIds.length ? await admin.schema("app").from("activity_feedback").select("rating,modification_comment").in("activity_option_id", optionIds).eq("educator_id", user.id).order("created_at", { ascending: false }).limit(10) : { data: [] };
    const { data: previousOptions } = await admin.schema("app").from("activity_options").select("generation_number,activity_type,activity_data,discard_reason,status").eq("activity_request_id", requestId).order("generation_number");
    const previousSummary = (previousOptions ?? []).map((item) => ({ generation: item.generation_number, type: item.activity_type, title: (item.activity_data as { title?: string })?.title, status: item.status, discardReason: item.discard_reason }));
    const proposalCount = previousSummary.length === 0 && !parsedBody.refinement ? 3 : 1;
    const context = {
      curriculum: { subject, topic }, durationMinutes: activityRequest.duration_minutes,
      availableMaterials: activityRequest.available_materials, extraInstructions: activityRequest.extra_instructions,
      students: anonymousStudents, approvedRecommendations: recommendations,
      previousFeedback: summarizeFeedback(feedback ?? []), previousProposals: previousSummary,
      requestedChange: parsedBody.refinement ?? null,
      regenerationRule: previousSummary.length ? "No repitas sustancialmente propuestas descartadas o ya mostradas." : null,
    };

    const generated = await callGemma(buildPrompt(context, proposalCount));
    assertNoNicknames(generated, students.map((student) => student.nickname));
    const nextGeneration = Math.max(0, ...previousSummary.map((item) => item.generation)) + 1;
    const model = Deno.env.get("GEMMA_MODEL")!;
    const promptVersion = Deno.env.get("PROMPT_VERSION") ?? "activity-v1";
    const rows = generated.proposals.map((proposal, index) => ({ activity_request_id: requestId, generation_number: nextGeneration + index, activity_type: proposal.activityType, activity_data: proposal, model_name: model, prompt_version: promptVersion, status: "generated" }));
    const { error: insertError } = await admin.schema("app").from("activity_options").insert(rows);
    if (insertError) throw new Error(insertError.code === "23505" ? "Actividad duplicada; vuelve a intentar." : insertError.message);
    await Promise.all([
      admin.schema("app").from("activity_requests").update({ status: "completed", error_message: null }).eq("id", requestId),
      admin.schema("app").from("audit_logs").insert({ educator_id: user.id, action: "activity.generated", resource_type: "activity_request", resource_id: requestId, metadata: { proposalCount: rows.length, promptVersion } }),
    ]);
    return jsonResponse({ requestId, proposalsCreated: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al generar.";
    if (admin && requestId) await admin.schema("app").from("activity_requests").update({ status: "failed", error_message: message.slice(0, 500) }).eq("id", requestId);
    return jsonResponse({ error: message }, 422);
  }
});
