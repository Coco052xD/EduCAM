import { describe, expect, it } from "vitest";
import { assertNoName, scrubName } from "../supabase/functions/_shared/safety";

describe("el nombre del alumno no llega al modelo", () => {
  it("limpia el nombre del comentario del educador antes de enviarlo", () => {
    const result = scrubName("A Mariana le funciona el material concreto", "Mariana Gómez");
    expect(result).toBe("A el alumno le funciona el material concreto");
    expect(result).not.toContain("Mariana");
  });

  it("limpia sin importar mayúsculas y respeta cada parte del nombre", () => {
    expect(scrubName("mariana y GÓMEZ trabajan mejor en pareja", "Mariana Gómez")).toBe("el alumno y el alumno trabajan mejor en pareja");
  });

  it("no toca palabras que solo contienen el nombre como fragmento", () => {
    expect(scrubName("Usar marianas de papel", "Mariana")).toBe("Usar marianas de papel");
  });

  it("deja pasar nombres de dos letras o menos para no destrozar el texto", () => {
    expect(scrubName("Al alumno le cuesta el ruido", "Al")).toBe("Al alumno le cuesta el ruido");
  });

  it("acepta comentario nulo", () => {
    expect(scrubName(null, "Mariana")).toBeNull();
  });

  it("rechaza una salida del modelo que incluye el nombre", () => {
    expect(() => assertNoName("Pide a Mariana que señale la figura", "Mariana Gómez")).toThrow(/nombre del alumno/);
  });

  it("acepta una salida sin el nombre", () => {
    expect(() => assertNoName("Pide al alumno que señale la figura", "Mariana Gómez")).not.toThrow();
  });
});
