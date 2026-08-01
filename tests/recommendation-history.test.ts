import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("supabase/functions/generate-recommendation/index.ts", "utf8");

describe("historial usado para generar recomendaciones", () => {
  it("aísla ejemplos y descartes por alumno, educador y tema", () => {
    const historyQueries = source
      .split("\n")
      .filter((line) => line.includes('admin.from("recommendations")'));

    expect(historyQueries).toHaveLength(2);
    for (const query of historyQueries) {
      expect(query).toContain('.eq("educator_id", user.id)');
      expect(query).toContain('.eq("student_id", body.studentId)');
      expect(query).toContain('.eq("subject_id", body.subjectId)');
    }
  });
});
