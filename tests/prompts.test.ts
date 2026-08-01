import { describe, expect, it } from "vitest";
import { END_MARKER, START_MARKER, extractRecommendation } from "../supabase/functions/_shared/prompts";

describe("extracción de la recomendación", () => {
  // Los cuerpos van a tamaño realista a propósito: por debajo de 80 caracteres
  // se activa el fallback, y entonces no se estaría probando la extracción.
  const CUERPO = "Cómo presentar el tema: muestre un objeto real junto a su dibujo. Cómo pedir la participación: trabaje en parejas con instrucciones de dos pasos.";

  it("se queda solo con lo que hay entre marcadores", () => {
    const raw = `Role: assistant for CAM educators.\nConstraint 1: use only provided context.\n${START_MARKER}\n${CUERPO}\n${END_MARKER}\nNo diagnosis? Yes.\nMax 400 words? Yes.`;
    const result = extractRecommendation(raw);
    expect(result).toBe(CUERPO);
    expect(result).not.toContain("Constraint");
    expect(result).not.toContain("No diagnosis");
  });

  it("si el modelo repite el marcador, toma el último bloque", () => {
    const raw = `${START_MARKER} borrador viejo ${START_MARKER}\n${CUERPO}\n${END_MARKER}`;
    expect(extractRecommendation(raw)).toBe(CUERPO);
  });

  it("devuelve el texto completo si el modelo omite los marcadores", () => {
    // Una recomendación con ruido es más útil que un error.
    expect(extractRecommendation("Cómo presentar el tema: use imágenes.")).toBe("Cómo presentar el tema: use imágenes.");
  });

  it("tolera que falte solo el marcador de cierre", () => {
    const cuerpo = "Cómo presentar el tema: muestre un objeto real y su dibujo, y compárelos frente al grupo.";
    expect(extractRecommendation(`preámbulo\n${START_MARKER}\n${cuerpo}`)).toBe(cuerpo);
  });

  it("cae al texto completo si el bloque marcado sale demasiado corto", () => {
    // Lo que pasó en producción: el modelo escribió los marcadores dentro de
    // su paráfrasis del formato, y entre ellos no quedó recomendación alguna.
    const raw = `Format: escriba ${START_MARKER}, luego el texto, luego ${END_MARKER}. Cómo presentar el tema: use objetos físicos y compárelos con su dibujo para explicar el concepto.`;
    const result = extractRecommendation(raw);
    expect(result).toContain("objetos físicos");
    expect(result).not.toContain(START_MARKER);
    expect(result).not.toContain(END_MARKER);
  });

  it("limpia viñetas de asterisco y cercas de código", () => {
    const raw = `${START_MARKER}\n\`\`\`markdown\n* *Qué material usar:* tarjetas.\n\`\`\`\n${END_MARKER}`;
    expect(extractRecommendation(raw)).toBe("Qué material usar: tarjetas.");
  });
});
