import { describe, expect, it } from "vitest";
import { CLOSING, FIRST_SECTION, SECTIONS, buildPrompt, extractRecommendation } from "../supabase/functions/_shared/prompts";

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

  it("pide los cuatro apartados y la frase de cierre", () => {
    const prompt = buildPrompt(context);
    for (const section of SECTIONS) expect(prompt).toContain(section);
    expect(prompt).toContain(CLOSING);
  });
});

describe("extracción de la recomendación", () => {
  const CUERPO = "muestre un objeto real junto a su dibujo.\n\nCómo pedir la participación: trabaje en parejas con instrucciones de dos pasos.";

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

  it("limpia viñetas y cercas de código", () => {
    const raw = "```markdown\n* **texto con viñeta**\n```";
    expect(extractRecommendation(raw)).toBe(`${FIRST_SECTION} texto con viñeta`);
  });
});
