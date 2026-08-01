/**
 * Gemma no tiene rol de sistema: todo el prompt es contenido que puede
 * comentar. Un prompt con forma de especificación (TAREA / REGLAS / FORMATO)
 * hace que devuelva su propio resumen de la especificación, en inglés.
 *
 * Por eso el prompt cierra con el primer encabezado de la respuesta: el modelo
 * queda continuando prosa en español en vez de contestando a una ficha
 * técnica. Es lo que ancla a la vez el idioma, el formato y la ausencia de
 * preámbulo.
 */
export const SECTIONS = [
  "Cómo presentar el tema:",
  "Cómo pedir la participación:",
  "Qué material usar:",
  "Cómo verificar la comprensión:",
] as const;

export const FIRST_SECTION = SECTIONS[0];
export const CLOSING = "Requiere revisión del educador antes de aplicarse.";

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
    `Eres un asistente de planeación pedagógica inclusiva para un Centro de Atención Múltiple en México.`,

    `Tema: ${subject.category} · ${subject.topic} (${subject.grade}.º de primaria)`,
    subject.learningObjective ? `Objetivo de aprendizaje: ${subject.learningObjective}` : "",

    `Así aprende el alumno. Esto pesa más que el padecimiento:
${student.profile.map((item) => `- ${item.question} ${item.answer}`).join("\n") || "- Sin respuestas registradas."}`,

    student.educatorComment ? `Observación del educador: ${student.educatorComment}` : "",
    `Edad ${student.ageRange} años, ${student.grade}.º de primaria. Padecimientos: ${student.conditions.join(", ") || "ninguno registrado"}.`,

    context.examples.length ? `Recomendaciones que este educador calificó como buenas. Reutiliza el enfoque, no el texto:\n${context.examples.map((item) => `- ${item.slice(0, 400)}`).join("\n")}` : "",
    context.rejected.length ? `Ya descartado por el educador, no lo repitas:\n${context.rejected.map((item) => `- ${item}`).join("\n")}` : "",
    context.refinement ? `El educador pide específicamente: ${context.refinement}` : "",

    `Escribe en español de México, dirigiéndote al educador de usted. Máximo 300 palabras, texto corrido, sin viñetas ni markdown. No diagnostiques, no menciones medicamentos ni tratamientos, no infieras capacidades a partir del padecimiento, no inventes datos que no estén arriba, y nunca escribas el nombre del alumno: di "el alumno". Usa exactamente estos cuatro apartados, en este orden: ${SECTIONS.join(" / ")} Cierra con la frase: ${CLOSING}`,

    // Cierra con el primer encabezado para que el modelo continúe la respuesta.
    FIRST_SECTION,
  ];
  return blocks.filter(Boolean).join("\n\n");
}

/** Restos frecuentes: cercas de código y viñetas que pedimos evitar. */
function clean(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/^\s*[*-]\s+/gm, "")
    .replace(/\*+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * El modelo continúa desde el primer encabezado, así que su salida normalmente
 * NO lo incluye y hay que reponerlo. Si además metió un preámbulo, el
 * encabezado sí aparece: se corta desde su última aparición, que es donde
 * empieza la respuesta de verdad y no su paráfrasis.
 */
export function extractRecommendation(raw: string): string {
  const start = raw.lastIndexOf(FIRST_SECTION);
  if (start !== -1) return clean(raw.slice(start));
  // Limpiar antes de reponer el encabezado: al revés arrastra el hueco que
  // dejan las cercas de código y queda un espacio doble.
  const body = clean(raw);
  return body ? `${FIRST_SECTION} ${body}` : "";
}
