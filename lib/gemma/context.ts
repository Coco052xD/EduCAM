export type IdentifiableStudent = { id: string; nickname: string; age_value: number | null; age_range: string | null; educational_level: string; enrolled_grade: string; learning_profile?: unknown; conditions?: string[] };

export function anonymizeStudents(students: IdentifiableStudent[]) {
  return students.map((student, index) => ({
    studentKey: `student_${String(index + 1).padStart(2, "0")}`,
    age_value: student.age_value,
    age_range: student.age_range,
    educational_level: student.educational_level,
    enrolled_grade: student.enrolled_grade,
    learning_profile: student.learning_profile,
    conditions: student.conditions,
  }));
}

export function summarizeFeedback(items: Array<{ rating: number; modification_comment: string }>) {
  return {
    successfulPatterns: items.filter((item) => item.rating >= 4).slice(0, 5).map((item) => item.modification_comment),
    aspectsToImprove: items.filter((item) => item.rating <= 3).slice(0, 5).map((item) => item.modification_comment),
  };
}
