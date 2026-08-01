// Specifiers completos, no bare imports: el import map de deno.json no viaja
// en el bundle del deploy y el bundler falla con "Relative import path".
import { createClient } from "jsr:@supabase/supabase-js@2";
import { z } from "npm:zod@4";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { buildPrompt, extractRecommendation } from "../_shared/prompts.ts";
import { callGemma } from "../_shared/gemma.ts";
import { assertNoName, scrubName } from "../_shared/safety.ts";

const bodySchema = z.object({
  studentId: z.uuid(),
  subjectId: z.uuid(),
  refinement: z.string().trim().max(300).optional(),
  regeneratedFrom: z.uuid().optional(),
});

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (request.method !== "POST") return jsonResponse({ error: "Método no permitido." }, 405);

    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Usuario no autenticado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado.");

    const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await authClient.auth.getUser(authorization.slice(7));
    if (authError || !user) return jsonResponse({ error: "Sesión inválida." }, 401);

    // service_role bypassa RLS, así que la pertenencia se comprueba a mano:
    // solo un educador activo puede generar.
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: educator } = await admin.from("educators").select("id").eq("id", user.id).eq("active", true).maybeSingle();
    if (!educator) return jsonResponse({ error: "Tu cuenta de educador no está activa." }, 403);

    const body = bodySchema.parse(await request.json());

    // Límite por hora contando la propia tabla: no hace falta un audit log aparte.
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const limit = Number(Deno.env.get("GENERATION_LIMIT_PER_HOUR") ?? "12");
    const { count } = await admin
      .from("recommendations")
      .select("id", { count: "exact", head: true })
      .eq("educator_id", user.id)
      .gte("created_at", hourAgo);
    if ((count ?? 0) >= limit) return jsonResponse({ error: "Límite de generación por hora alcanzado." }, 429);

    const [{ data: student }, { data: subject }, { data: answers }, { data: conditionLinks }] = await Promise.all([
      admin.from("students").select("id,name,grade,age_range,profile_comment").eq("id", body.studentId).eq("active", true).maybeSingle(),
      admin.from("subjects").select("id,category,topic,grade,learning_objective").eq("id", body.subjectId).maybeSingle(),
      admin.from("student_profile_answers").select("profile_questions(question,sort_order),profile_options(label)").eq("student_id", body.studentId),
      admin.from("student_conditions").select("conditions(name)").eq("student_id", body.studentId),
    ]);
    if (!student) return jsonResponse({ error: "Alumno no encontrado." }, 404);
    if (!subject) return jsonResponse({ error: "Tema no encontrado." }, 404);
    if (subject.grade !== student.grade) return jsonResponse({ error: "El tema no corresponde al grado del alumno." }, 422);

    const profile = ((answers ?? []) as unknown as Array<{ profile_questions: { question: string; sort_order: number } | null; profile_options: { label: string } | null }>)
      .filter((row) => row.profile_questions && row.profile_options)
      .sort((a, b) => a.profile_questions!.sort_order - b.profile_questions!.sort_order)
      .map((row) => ({ question: row.profile_questions!.question, answer: row.profile_options!.label }));
    if (!profile.length) return jsonResponse({ error: "El alumno necesita un perfil de aprendizaje completo." }, 422);

    const conditions = ((conditionLinks ?? []) as unknown as Array<{ conditions: { name: string } | null }>)
      .map((row) => row.conditions?.name)
      .filter((name): name is string => Boolean(name));

    // Few-shot: lo que este educador ya calificó como bueno para el mismo tema.
    const [{ data: examples }, { data: rejected }] = await Promise.all([
      admin.from("recommendations").select("content").eq("subject_id", body.subjectId).eq("rating", "good").order("rated_at", { ascending: false }).limit(3),
      admin.from("recommendations").select("content,comment").eq("student_id", body.studentId).eq("subject_id", body.subjectId).eq("rating", "bad").order("rated_at", { ascending: false }).limit(3),
    ]);

    const context = {
      subject: { category: subject.category, topic: subject.topic, learningObjective: subject.learning_objective, grade: subject.grade },
      student: {
        ageRange: student.age_range,
        grade: student.grade,
        profile,
        conditions,
        educatorComment: scrubName(student.profile_comment, student.name),
      },
      examples: (examples ?? []).map((row) => row.content as string),
      rejected: (rejected ?? []).map((row) => (row.comment as string | null) ?? (row.content as string).slice(0, 200)),
      refinement: body.refinement ?? null,
    };

    let content = "";
    let rawModelOutput = "";
    for (let attempt = 0; attempt < 2 && !content; attempt += 1) {
      rawModelOutput = await callGemma(buildPrompt(context, attempt > 0));
      content = extractRecommendation(rawModelOutput);
    }
    if (!content) {
      // Nunca guardar razonamiento, texto en inglés o una respuesta incompleta.
      // El crudo queda solo en logs para poder diagnosticar al proveedor.
      throw new Error(`Gemma no entregó una actividad válida en dos intentos. Última salida: ${JSON.stringify(rawModelOutput.slice(0, 600))}`);
    }
    assertNoName(content, student.name);

    const { data: inserted, error: insertError } = await admin
      .from("recommendations")
      .insert({
        student_id: body.studentId,
        subject_id: body.subjectId,
        educator_id: user.id,
        content,
        context,
        model: Deno.env.get("GEMMA_MODEL")!,
        regenerated_from: body.regeneratedFrom ?? null,
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    return jsonResponse({ recommendationId: inserted.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error inesperado al generar.";
    // A la pestaña Logs del dashboard: Invocations solo muestra el código, y
    // sin esto un 422 obliga a adivinar cuál de los seis fallos posibles fue.
    console.error("generate-recommendation falló:", message);
    return jsonResponse({ error: message }, 422);
  }
});
