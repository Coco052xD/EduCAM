import { describe, expect, it } from "vitest";
import { FIRST_SECTION, SECTIONS, buildFallbackRecommendation, buildPrompt, extractRecommendation } from "../supabase/functions/_shared/prompts";

const context = {
  subject: { category: "Lenguajes", topic: "Lectura de imágenes", learningObjective: "Construir significados a partir de imágenes.", grade: 3 },
  student: {
    ageRange: "7-9",
    grade: 3,
    profile: [{ question: "¿Cómo comprende mejor las instrucciones?", answer: "Objetos físicos" }],
    conditions: ["Discapacidad auditiva"],
    educatorComment: "Se levanta entre clases.",
  },
  examples: [],
  rejected: [],
  refinement: null,
};

describe("construcción del prompt", () => {
  it("cierra con el primer encabezado, para que el modelo continúe la respuesta", () => {
    // Es lo que evita el preámbulo: el modelo completa prosa, no contesta a
    // una ficha técnica que luego resume en inglés.
    expect(buildPrompt(context).endsWith(FIRST_SECTION)).toBe(true);
  });

  it("pone el perfil por encima del padecimiento de forma explícita", () => {
    expect(buildPrompt(context)).toContain("Esto pesa más que el padecimiento");
  });

  it("no filtra el nombre del alumno: el contexto nunca lo recibe", () => {
    expect(buildPrompt(context)).not.toMatch(/nombre del alumno: [A-Z]/);
    expect(buildPrompt(context)).toContain('di "el alumno"');
  });

  it("omite los bloques vacíos en vez de dejar encabezados huérfanos", () => {
    const prompt = buildPrompt(context);
    expect(prompt).not.toContain("calificó como buenas");
    expect(prompt).not.toContain("Ya descartado");
    expect(prompt).not.toContain("pide específicamente");
  });

  it("incluye los ejemplos y descartes cuando existen", () => {
    const prompt = buildPrompt({ ...context, examples: ["Usar tarjetas."], rejected: ["Demasiado texto."], refinement: "Menos material impreso." });
    expect(prompt).toContain("Usar tarjetas.");
    expect(prompt).toContain("Demasiado texto.");
    expect(prompt).toContain("Menos material impreso.");
  });

  it("pide una respuesta breve, directa y dividida en cuatro momentos", () => {
    const prompt = buildPrompt(context);
    for (const section of SECTIONS) expect(prompt).toContain(section);
    expect(prompt).toContain("Máximo 90 palabras");
    expect(prompt).toContain("verbos de acción");
    expect(prompt).toContain("Evita teoría, justificaciones y términos técnicos");
    for (const section of SECTIONS) expect(prompt).toContain(section);
    expect(prompt).not.toMatch(/final check|markdown/i);
  });

  it("refuerza el segundo intento sin cambiar los datos del contexto", () => {
    const retry = buildPrompt(context, true);
    expect(retry).toContain("El intento anterior no produjo una actividad");
    expect(retry).toContain(context.subject.topic);
  });

  it("repite el tema justo antes de generar, para que no se pierda en el contexto", () => {
    // Visto en producción: con el perfil, los ejemplos y las reglas de por
    // medio, el modelo respondió sobre un tema completamente distinto al
    // pedido. El tema repetido pegado al encabezado es el ancla contra eso.
    const prompt = buildPrompt(context);
    const anchorIndex = prompt.indexOf(context.subject.topic, prompt.indexOf("Esto pesa más que el padecimiento"));
    const headerIndex = prompt.lastIndexOf(FIRST_SECTION);
    expect(anchorIndex).toBeGreaterThan(-1);
    expect(headerIndex - anchorIndex).toBeLessThan(120);
  });
});

describe("actividad de respaldo", () => {
  it("produce una actividad breve, válida y en español", () => {
    const fallback = buildFallbackRecommendation(context);
    expect(extractRecommendation(fallback)).toBe(fallback);
    expect(fallback.split(/\s+/).length).toBeLessThanOrEqual(90);
    expect(fallback).toContain("un objeto cotidiano");
  });

  it("adapta la participación cuando el perfil prefiere parejas", () => {
    const paired = buildFallbackRecommendation({
      ...context,
      student: { ...context.student, profile: [...context.student.profile, { question: "¿Cómo participa?", answer: "En parejas" }] },
    });
    expect(paired).toContain("Forma una pareja");
  });
});

describe("extracción de la recomendación", () => {
  const CUERPO = "Muestra un objeto real junto a su dibujo.\nActividad: Invita al alumno a relacionarlos.\nMateriales: Un objeto y una tarjeta.\nCierre rápido: Pídele señalar la pareja correcta.";

  it("repone el encabezado cuando el modelo continúa desde él", () => {
    // Caso normal: el prompt termina con el encabezado, así que la salida
    // empieza directamente con el contenido.
    expect(extractRecommendation(CUERPO)).toBe(`${FIRST_SECTION} ${CUERPO}`);
  });

  it("descarta el preámbulo si el modelo lo escribe", () => {
    const raw = `Role: assistant for CAM educators.\nTask: write a recommendation.\nFormat: four sections.\n\n${FIRST_SECTION} ${CUERPO}`;
    const result = extractRecommendation(raw);
    expect(result.startsWith(FIRST_SECTION)).toBe(true);
    expect(result).not.toContain("Role:");
    expect(result).not.toContain("Format:");
  });

  it("toma la última aparición del encabezado, no la de la paráfrasis", () => {
    const raw = `Format: use exactly "${FIRST_SECTION}" as the first heading.\n\n${FIRST_SECTION} ${CUERPO}`;
    expect(extractRecommendation(raw)).toBe(`${FIRST_SECTION} ${CUERPO}`);
  });

  it("rechaza la salida cuando el modelo repite la cola del prompt", () => {
    const raw = `${FIRST_SECTION} ${CUERPO}\n\nUsa exactamente estos cuatro apartados.\n\n${FIRST_SECTION}`;
    expect(extractRecommendation(raw)).toBe("");
  });

  it("limpia viñetas y cercas de código", () => {
    const raw = `\`\`\`markdown\n* **${FIRST_SECTION} Muestra una tarjeta.**\n* **Actividad: Pide al alumno elegir una imagen.**\n* **Materiales: Dos tarjetas.**\n* **Cierre rápido: Celebra la elección.**\n\`\`\``;
    expect(extractRecommendation(raw)).toBe(`${FIRST_SECTION} Muestra una tarjeta.\nActividad: Pide al alumno elegir una imagen.\nMateriales: Dos tarjetas.\nCierre rápido: Celebra la elección.`);
  });

  it("rechaza análisis en inglés aunque mencione el formato", () => {
    const raw = `Cómo presentar el tema: / Cómo pedir la participación: / Qué material usar: / Cómo verificar la comprensión:. The slashes might imply they are separators in the instructions.\n\nFinal check on content:\nPhysical objects? Yes.\n2 steps? Yes.`;
    expect(extractRecommendation(raw)).toBe("");
  });

  it("rechaza respuestas incompletas", () => {
    expect(extractRecommendation("Muestra un objeto real y pide que lo señale.")).toBe("");
  });

  it("rechaza instrucciones escritas en inglés", () => {
    const raw = `${FIRST_SECTION} Show a picture.\nActividad: Ask the student to choose.\nMateriales: Two cards.\nCierre rápido: Check the answer.`;
    expect(extractRecommendation(raw)).toBe("");
  });
});
