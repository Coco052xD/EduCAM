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
  "Inicio:",
  "Actividad:",
  "Materiales:",
  "Cierre rápido:",
] as const;

export const FIRST_SECTION = SECTIONS[0];

type PromptContext = {
  subject: { category: string; topic: string; learningObjective: string | null; grade: number };
  student: { ageRange: string; grade: number; profile: Array<{ question: string; answer: string }>; conditions: string[]; educatorComment: string | null };
  examples: string[];
  rejected: string[];
  refinement: string | null;
};

export function buildPrompt(context: PromptContext, retry = false) {
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
    retry ? `El intento anterior no respetó el formato. Esta vez entrega únicamente la actividad final.` : "",

    `Propón una microactividad lista para aplicar. Escribe solamente en español de México y háblale de tú al educador. Máximo 90 palabras en total. Usa una sola frase corta por apartado, con verbos de acción e instrucciones concretas. Evita teoría, justificaciones y términos técnicos. No expliques tus decisiones, no repitas estas reglas y no escribas comprobaciones como "final check". Sin viñetas ni markdown. No diagnostiques, no menciones medicamentos ni tratamientos, no infieras capacidades a partir del padecimiento, no inventes datos que no estén arriba y nunca escribas el nombre del alumno: di "el alumno".

Entrega solo estos cuatro apartados, cada uno en una línea y en este orden:
${SECTIONS.join("\n")}
No escribas nada antes de "${FIRST_SECTION}" ni después del contenido de "${SECTIONS.at(-1)}".`,

    // Cierra con el primer encabezado para que el modelo continúe la respuesta.
    FIRST_SECTION,
  ];
  return blocks.filter(Boolean).join("\n\n");
}

/** Límites flexibles: el prompt pide 90; se tolera un pequeño margen. */
const MIN_USEFUL = 60;
const MAX_WORDS = 110;
const META_TEXT = /\b(final check|the instructions?|the slashes?|headers?|markdown|physical objects?|steps?\?|yes\.?|role:|task:|format:|usa exactamente|estos cuatro apartados|las reglas|el formato)\b/i;
const ENGLISH_ACTIVITY = /\b(show|ask|use|student|teacher|choose|match|point|give|place|check|materials?)\b/gi;

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

function isValid(candidate: string): boolean {
  if (candidate.length < MIN_USEFUL || META_TEXT.test(candidate)) return false;
  if (candidate.split(/\s+/).filter(Boolean).length > MAX_WORDS) return false;
  if ((candidate.match(ENGLISH_ACTIVITY) ?? []).length >= 2) return false;

  let previous = -1;
  for (const section of SECTIONS) {
    const position = candidate.indexOf(section);
    if (position <= previous || candidate.indexOf(section, position + section.length) !== -1) return false;
    previous = position;
  }

  return SECTIONS.every((section, index) => {
    const start = candidate.indexOf(section) + section.length;
    const end = index + 1 < SECTIONS.length ? candidate.indexOf(SECTIONS[index + 1]) : candidate.length;
    return candidate.slice(start, end).trim().length >= 3;
  });
}

/**
 * El modelo continúa desde el primer encabezado, así que su salida normalmente
 * NO lo incluye y hay que reponerlo. Si además metió un preámbulo, el
 * encabezado sí aparece: se corta desde su última aparición, que es donde
 * empieza la respuesta de verdad y no su paráfrasis.
 */
export function extractRecommendation(raw: string): string {
  const positions: number[] = [];
  for (let i = raw.indexOf(FIRST_SECTION); i !== -1; i = raw.indexOf(FIRST_SECTION, i + FIRST_SECTION.length)) {
    positions.push(i);
  }

  // De atrás hacia adelante: la última aparición es la respuesta real, salvo
  // cuando el modelo repite la cola del prompt y el encabezado queda al final
  // sin nada después. En ese caso hay que seguir buscando hacia atrás.
  for (const start of positions.reverse()) {
    const candidate = clean(raw.slice(start));
    if (isValid(candidate)) return candidate;
  }

  // Sin encabezado utilizable: el modelo continuó desde el prompt y hay que
  // reponerlo. Limpiar antes de anteponer, o el hueco de las cercas de código
  // deja un espacio doble.
  const body = clean(raw);
  const candidate = body ? `${FIRST_SECTION} ${body}` : "";
  return isValid(candidate) ? candidate : "";
}
