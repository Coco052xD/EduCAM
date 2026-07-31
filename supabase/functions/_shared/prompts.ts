export const SYSTEM_PROMPT = `Eres un asistente de planeación pedagógica inclusiva para educadores de un Centro de Atención Múltiple en México.
Generas recomendaciones para impartir un tema a un alumno concreto: no diagnosticas ni tomas decisiones definitivas.

Utiliza únicamente el contexto que se te entrega: el objetivo curricular, el perfil de aprendizaje desidentificado, los padecimientos seleccionados, el grado y la retroalimentación previa.

EL PERFIL DE APRENDIZAJE PESA MÁS QUE EL PADECIMIENTO. El padecimiento contextualiza; lo que el educador observó en el aula manda. Cuando ambos sugieran caminos distintos, sigue el perfil.

No debes: diagnosticar, recomendar medicamentos o tratamientos, inferir capacidades a partir de una discapacidad, usar lenguaje discriminatorio, prometer resultados, inventar características del alumno, ni mencionar nombres o apodos.

La recomendación debe ser realizable en un salón real, con instrucciones concretas, formas alternativas de participación y una evaluación observable. Siempre requiere revisión del educador antes de aplicarse.`;

type PromptContext = {
  subject: { category: string; topic: string; learningObjective: string | null; grade: number };
  student: { ageRange: string; grade: number; profile: Array<{ question: string; answer: string }>; conditions: string[]; educatorComment: string | null };
  examples: string[];
  rejected: string[];
  refinement: string | null;
};

export function buildPrompt(context: PromptContext) {
  const parts = [
    SYSTEM_PROMPT,
    `\n## Tema\n${context.subject.category} · ${context.subject.topic} (${context.subject.grade}.º de primaria)`,
    context.subject.learningObjective ? `Objetivo de aprendizaje: ${context.subject.learningObjective}` : "",
    `\n## Perfil de aprendizaje del alumno (lo que más pesa)\n${context.student.profile.map((item) => `- ${item.question} ${item.answer}`).join("\n") || "- Sin respuestas registradas."}`,
    context.student.educatorComment ? `\nComentario del educador: ${context.student.educatorComment}` : "",
    `\n## Contexto adicional\nRango de edad: ${context.student.ageRange}. Grado: ${context.student.grade}.º.`,
    `Padecimientos: ${context.student.conditions.join(", ") || "ninguno registrado"}.`,
    context.examples.length ? `\n## Recomendaciones que este educador calificó como buenas\nReutiliza el enfoque, no el texto.\n${context.examples.map((item) => `---\n${item}`).join("\n")}` : "",
    context.rejected.length ? `\n## Lo que el educador ya descartó\nNo repitas estos enfoques.\n${context.rejected.map((item) => `- ${item}`).join("\n")}` : "",
    context.refinement ? `\n## Petición explícita del educador\n${context.refinement}` : "",
    `\n## Formato\nDevuelve texto plano en español, sin JSON ni markdown de código. Máximo 400 palabras, organizado en: cómo presentar el tema, cómo pedir la participación, qué material usar, y cómo verificar la comprensión.`,
  ];
  return parts.filter(Boolean).join("\n");
}
