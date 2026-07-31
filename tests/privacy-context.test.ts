import { describe, expect, it } from "vitest";
import { anonymizeStudents, summarizeFeedback } from "@/lib/gemma/context";

describe("contexto seguro para Gemma", () => {
  it("elimina id y apodo y asigna claves estables", () => {
    const result = anonymizeStudents([{ id: "secret-id", nickname: "Nombre secreto", age_value: 9, age_range: null, educational_level: "Primaria", enrolled_grade: "3°", learning_profile: { interests: ["música"] } }]);
    const serialized = JSON.stringify(result);
    expect(result[0].studentKey).toBe("student_01");
    expect(serialized).not.toContain("secret-id");
    expect(serialized).not.toContain("Nombre secreto");
  });
  it("separa patrones positivos y aspectos a mejorar", () => {
    const result = summarizeFeedback([{ rating: 5, modification_comment: "Funcionó el material concreto" }, { rating: 2, modification_comment: "Reducir la duración" }]);
    expect(result.successfulPatterns).toEqual(["Funcionó el material concreto"]);
    expect(result.aspectsToImprove).toEqual(["Reducir la duración"]);
  });
});
