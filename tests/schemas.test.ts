import { describe, expect, it } from "vitest";
import { generatedActivitySchema } from "@/lib/schemas/activity";
import { studentSchema } from "@/lib/schemas/domain";

const validActivity = {
  title: "Clasificamos objetos del aula", activityType: "manipulative", objective: "Clasificar objetos mediante atributos observables.",
  durationMinutes: 30, materials: ["tapas"], preparation: ["Separar materiales"],
  steps: [
    { order: 1, instruction: "Explorar los objetos.", estimatedMinutes: 10, educatorSupport: "Modelar una opción." },
    { order: 2, instruction: "Crear grupos de objetos.", estimatedMinutes: 15, educatorSupport: "Ofrecer formas de respuesta." },
  ],
  studentAdaptations: [{ studentKey: "student_01", recommendations: ["Usar material concreto"] }],
  assessment: { evidence: ["Clasificación"], observationCriteria: ["Explica un atributo"], responseOptions: ["Señalar", "Hablar"] },
  rationale: "Ofrece acceso por diferentes vías.", safetyNotes: [], requiresHumanReview: true,
};

describe("validaciones estructuradas", () => {
  it("acepta una actividad completa", () => expect(generatedActivitySchema.safeParse(validActivity).success).toBe(true));
  it("rechaza una respuesta sin revisión humana", () => expect(generatedActivitySchema.safeParse({ ...validActivity, requiresHumanReview: false }).success).toBe(false));
  it("rechaza identificadores de alumno no anónimos", () => expect(generatedActivitySchema.safeParse({ ...validActivity, studentAdaptations: [{ studentKey: "Ana", recommendations: [] }] }).success).toBe(false));
  it("exige edad o rango, pero no ambos", () => {
    const base = { groupId: crypto.randomUUID(), nickname: "Ejemplo", educationalLevel: "Primaria", enrolledGrade: "3°", conditionIds: [crypto.randomUUID()] };
    expect(studentSchema.safeParse({ ...base, ageValue: 9, ageRange: null }).success).toBe(true);
    expect(studentSchema.safeParse({ ...base, ageValue: 9, ageRange: "8 a 10" }).success).toBe(false);
  });
});
