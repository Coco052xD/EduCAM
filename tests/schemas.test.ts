import { describe, expect, it } from "vitest";
import { groupSchema, learningProfileSchema, studentSchema } from "@/lib/schemas/domain";

const validStudent = {
  name: "Alumno de ejemplo",
  grade: 4,
  ageRange: "10-12",
  groupId: crypto.randomUUID(),
  conditionIds: [crypto.randomUUID()],
  profileComment: null,
};

describe("validación del alumno", () => {
  it("acepta un alumno con datos mínimos", () => {
    expect(studentSchema.safeParse(validStudent).success).toBe(true);
  });

  it("acepta el grado como string, porque los <select> mandan texto", () => {
    const parsed = studentSchema.safeParse({ ...validStudent, grade: "5" });
    expect(parsed.success && parsed.data.grade).toBe(5);
  });

  it("rechaza grados fuera de 3.º a 6.º, igual que el check de la base", () => {
    expect(studentSchema.safeParse({ ...validStudent, grade: 2 }).success).toBe(false);
    expect(studentSchema.safeParse({ ...validStudent, grade: 7 }).success).toBe(false);
  });

  it("rechaza rangos de edad fuera del catálogo", () => {
    expect(studentSchema.safeParse({ ...validStudent, ageRange: "8 a 10 años" }).success).toBe(false);
  });

  it("exige al menos un padecimiento", () => {
    expect(studentSchema.safeParse({ ...validStudent, conditionIds: [] }).success).toBe(false);
  });
});

describe("validación del grupo", () => {
  it("exige el formato de ciclo escolar", () => {
    expect(groupSchema.safeParse({ name: "Grupo A", grade: 3, schoolYear: "2025-2026" }).success).toBe(true);
    expect(groupSchema.safeParse({ name: "Grupo A", grade: 3, schoolYear: "2025" }).success).toBe(false);
  });
});

describe("validación del perfil de aprendizaje", () => {
  it("acepta un mapa de pregunta a opción", () => {
    const answers = { [crypto.randomUUID()]: crypto.randomUUID() };
    expect(learningProfileSchema.safeParse({ studentId: crypto.randomUUID(), answers }).success).toBe(true);
  });

  it("rechaza un formulario vacío", () => {
    expect(learningProfileSchema.safeParse({ studentId: crypto.randomUUID(), answers: {} }).success).toBe(false);
  });

  it("rechaza respuestas que no son uuid", () => {
    expect(learningProfileSchema.safeParse({ studentId: crypto.randomUUID(), answers: { "no-uuid": crypto.randomUUID() } }).success).toBe(false);
  });
});
