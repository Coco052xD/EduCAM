/**
 * Gemma no tiene rol de sistema: todo el prompt es contenido que el modelo
 * puede comentar. En la práctica reescribe las instrucciones en inglés y añade
 * una lista de autoverificación al final. Por eso la salida va delimitada y se
 * extrae, en vez de confiar en un "no repitas las instrucciones".
 */
export const START_MARKER = "###RECOMENDACION###";
export const END_MARKER = "###FIN###";

type PromptContext = {
  subject: { category: string; topic: string; learningObjective: string | null; grade: number };
  student: { ageRange: string; grade: number; profile: Array<{ question: string; answer: string }>; conditions: string[]; educatorComment: string | null };
  examples: string[];
  rejected: string[];
  refinement: string | null;
};

export function buildPrompt(context: PromptContext) {
  const { subject, student } = context;
  const blocks = [
    `Eres un asistente de planeación pedagógica inclusiva para educadores de un Centro de Atención Múltiple en México. Escribes en español de México, dirigiéndote al educador de usted.`,

    `TAREA: escribe una recomendación de cómo impartir el tema de abajo a un alumno concreto.`,

    `REGLAS:
- El perfil de aprendizaje pesa más que el padecimiento. El padecimiento contextualiza; lo que el educador observó en el aula manda.
- No diagnostiques, no menciones medicamentos ni tratamientos, no infieras capacidades a partir de una discapacidad.
- No inventes características del alumno: usa solo lo que está abajo.
- Nunca escribas el nombre del alumno. Di "el alumno".
- Cierra con la frase: Requiere revisión del educador antes de aplicarse.`,

    `TEMA: ${subject.category} · ${subject.topic} (${subject.grade}.º de primaria)`,
    subject.learningObjective ? `OBJETIVO: ${subject.learningObjective}` : "",

    `PERFIL DE APRENDIZAJE (lo que más pesa):
${student.profile.map((item) => `- ${item.question} ${item.answer}`).join("\n") || "- Sin respuestas registradas."}`,
    student.educatorComment ? `OBSERVACIÓN DEL EDUCADOR: ${student.educatorComment}` : "",

    `CONTEXTO: ${student.ageRange} años, ${student.grade}.º de primaria. Padecimientos: ${student.conditions.join(", ") || "ninguno registrado"}.`,

    context.examples.length ? `RECOMENDACIONES QUE ESTE EDUCADOR CALIFICÓ COMO BUENAS (reutiliza el enfoque, no el texto):\n${context.examples.map((item) => `- ${item.slice(0, 400)}`).join("\n")}` : "",
    context.rejected.length ? `YA DESCARTADO POR EL EDUCADOR (no lo repitas):\n${context.rejected.map((item) => `- ${item}`).join("\n")}` : "",
    context.refinement ? `PETICIÓN EXPLÍCITA DEL EDUCADOR: ${context.refinement}` : "",

    `FORMATO DE RESPUESTA:
Escribe ${START_MARKER}, luego la recomendación, luego ${END_MARKER}.
Fuera de esos marcadores no escribas nada.
Dentro: máximo 300 palabras, en español, texto corrido sin markdown ni viñetas con asterisco, con estos cuatro apartados y nada más:

Cómo presentar el tema:
Cómo pedir la participación:
Qué material usar:
Cómo verificar la comprensión:

No repitas estas instrucciones. No incluyas listas de verificación ni comentarios sobre tu propia respuesta.`,
  ];
  return blocks.filter(Boolean).join("\n\n");
}

/**
 * Se queda con lo que hay entre marcadores. Si el modelo los omite, devuelve
 * el texto completo: una recomendación con ruido es más útil que un error.
 */
export function extractRecommendation(raw: string): string {
  let text = raw;

  const start = text.lastIndexOf(START_MARKER);
  if (start !== -1) text = text.slice(start + START_MARKER.length);

  const end = text.indexOf(END_MARKER);
  if (end !== -1) text = text.slice(0, end);

  // Restos frecuentes: cercas de código y viñetas de asterisco que pedimos evitar.
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s*\*\s+/gm, "")
    .replace(/\*+/g, "")
    .trim();
}
