import { describe, expect, it } from "vitest";
import { END_MARKER, START_MARKER, extractRecommendation } from "../supabase/functions/_shared/prompts";

describe("extracción de la recomendación", () => {
  it("se queda solo con lo que hay entre marcadores", () => {
    const raw = `Role: assistant for CAM educators.\nConstraint 1: use only provided context.\n${START_MARKER}\nCómo presentar el tema: use objetos físicos.\n${END_MARKER}\nNo diagnosis? Yes.\nMax 400 words? Yes.`;
    const result = extractRecommendation(raw);
    expect(result).toBe("Cómo presentar el tema: use objetos físicos.");
    expect(result).not.toContain("Constraint");
    expect(result).not.toContain("No diagnosis");
  });

  it("si el modelo repite el marcador, toma el último bloque", () => {
    const raw = `${START_MARKER} borrador viejo ${START_MARKER}\nVersión final del texto.\n${END_MARKER}`;
    expect(extractRecommendation(raw)).toBe("Versión final del texto.");
  });

  it("devuelve el texto completo si el modelo omite los marcadores", () => {
    // Una recomendación con ruido es más útil que un error.
    expect(extractRecommendation("Cómo presentar el tema: use imágenes.")).toBe("Cómo presentar el tema: use imágenes.");
  });

  it("tolera que falte solo el marcador de cierre", () => {
    expect(extractRecommendation(`preámbulo\n${START_MARKER}\nEl texto útil.`)).toBe("El texto útil.");
  });

  it("limpia viñetas de asterisco y cercas de código", () => {
    const raw = `${START_MARKER}\n\`\`\`markdown\n* *Qué material usar:* tarjetas.\n\`\`\`\n${END_MARKER}`;
    expect(extractRecommendation(raw)).toBe("Qué material usar: tarjetas.");
  });
});
