/** Gemma continúa desde el primer encabezado para evitar preámbulos. */
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
    `Escribe una actividad escolar inclusiva, breve y lista para aplicar en un Centro de Atención Múltiple de México.`,

    `Tema: ${subject.category} · ${subject.topic} (${subject.grade}.º de primaria)`,
    subject.learningObjective ? `Objetivo de aprendizaje: ${subject.learningObjective}` : "",

    `Así aprende el alumno. Esto pesa más que el padecimiento:
${student.profile.map((item) => `- ${item.question} ${item.answer}`).join("\n") || "- Sin respuestas registradas."}`,

    student.educatorComment ? `Observación del educador: ${student.educatorComment}` : "",
    `Edad ${student.ageRange} años, ${student.grade}.º de primaria. Padecimientos: ${student.conditions.join(", ") || "ninguno registrado"}.`,

    context.examples.length ? `Recomendaciones que este educador calificó como buenas. Reutiliza el enfoque, no el texto:\n${context.examples.map((item) => `- ${item.slice(0, 400)}`).join("\n")}` : "",
    context.rejected.length ? `Ya descartado por el educador, no lo repitas:\n${context.rejected.map((item) => `- ${item}`).join("\n")}` : "",
    context.refinement ? `El educador pide específicamente: ${context.refinement}` : "",
    retry ? `El intento anterior no produjo una actividad. Responde ahora únicamente con las cuatro instrucciones solicitadas.` : "",

    `Escribe solamente en español de México y háblale de tú al educador. Máximo 90 palabras en total. Usa una frase corta por apartado, con verbos de acción e instrucciones concretas. Evita teoría, justificaciones y términos técnicos. No expliques tus decisiones ni repitas las reglas. No uses viñetas ni formato especial. No diagnostiques, no menciones medicamentos ni tratamientos, no infieras capacidades a partir del padecimiento, no inventes datos y nunca escribas el nombre del alumno: di "el alumno".

La respuesta debe tener exactamente esta forma, con una instrucción después de cada título:
Inicio: presenta el tema de forma concreta.
Actividad: indica qué harán el educador y el alumno.
Materiales: menciona solo lo necesario.
Cierre rápido: comprueba lo aprendido con una acción sencilla.
No escribas nada antes de "${FIRST_SECTION}" ni después del contenido de "${SECTIONS.at(-1)}".`,

    // Cierra con el primer encabezado para que el modelo continúe la respuesta.
    FIRST_SECTION,
  ];
  return blocks.filter(Boolean).join("\n\n");
}

/** Respuesta local segura cuando el proveedor no sigue las instrucciones. */
export function buildFallbackRecommendation(context: PromptContext): string {
  const answers = context.student.profile.map((item) => item.answer).join(" ").toLocaleLowerCase("es-MX");
  const prefersPairs = /pareja|compañer/.test(answers);

  let support = "un ejemplo cercano";
  let materials = "dos tarjetas, una hoja y un lápiz";
  if (/objeto|físic|concreto|manipul/.test(answers)) {
    support = "un objeto cotidiano";
    materials = "un objeto cotidiano y dos tarjetas";
  } else if (/imagen|visual|dibujo/.test(answers)) {
    support = "una imagen grande";
    materials = "dos imágenes grandes, una hoja y un lápiz";
  } else if (/movimiento|corporal/.test(answers)) {
    support = "un gesto o movimiento";
    materials = "dos tarjetas y un espacio libre";
  }

  const topic = context.subject.topic.slice(0, 80);
  const activity = prefersPairs
    ? `Forma una pareja e invítalos a elegir o representar un ejemplo de ${topic}.`
    : `Invita al alumno a elegir o representar un ejemplo de ${topic}.`;

  return `${FIRST_SECTION} Presenta ${topic} con ${support}.\nActividad: ${activity}\nMateriales: Usa ${materials}.\nCierre rápido: Pide al alumno mostrar su respuesta con una palabra, gesto o dibujo.`;
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
