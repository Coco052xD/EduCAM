export type StudentRow = { id: string; nickname: string; age_value: number | null; age_range: string | null; educational_level: string; enrolled_grade: string };

export function anonymizeStudents(students: StudentRow[], profilesByStudent: Map<string, unknown>, conditionsByStudent: Map<string, string[]>) {
  return students.map((student, index) => ({
    studentKey: `student_${String(index + 1).padStart(2, "0")}`,
    age: student.age_value ?? student.age_range,
    educationalLevel: student.educational_level,
    enrolledGrade: student.enrolled_grade,
    learningProfile: profilesByStudent.get(student.id),
    selectedConditions: conditionsByStudent.get(student.id) ?? [],
  }));
}

export function assertNoNicknames(output: unknown, nicknames: string[]) {
  const serialized = JSON.stringify(output).toLocaleLowerCase("es-MX");
  const leaked = nicknames.find((name) => name.length > 1 && serialized.includes(name.toLocaleLowerCase("es-MX")));
  if (leaked) throw new Error("La respuesta del modelo incluyó un identificador prohibido.");
}

export function summarizeFeedback(items: Array<{ rating: number; modification_comment: string }>) {
  return {
    successfulPatterns: items.filter((item) => item.rating >= 4).slice(0, 5).map((item) => item.modification_comment),
    aspectsToImprove: items.filter((item) => item.rating <= 3).slice(0, 5).map((item) => item.modification_comment),
    interpretation: "1-2: evitar repetir sin cambios; 3: conservar idea y ajustar; 4-5: reutilizar elementos sin copiar.",
  };
}
