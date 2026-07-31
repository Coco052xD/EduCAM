import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("supabase/migrations/20260731165325_init_educam_schema.sql", "utf8");

/**
 * Son datos de salud de menores: que RLS quede activo no puede depender de que
 * alguien se acuerde de revisarlo a mano.
 */
describe("la migración inicial protege los datos", () => {
  const protectedTables = [
    "students",
    "student_conditions",
    "student_profile_answers",
    "student_groups",
    "student_group_members",
    "classes",
    "recommendations",
    "educators",
  ];

  it.each(protectedTables)("habilita RLS en %s", (table) => {
    expect(schema).toMatch(new RegExp(`alter table public\\.${table}\\s+enable row level security`));
  });

  it("los catálogos son de solo lectura para el cliente", () => {
    for (const policy of ["conditions_read", "subjects_read", "questions_read", "options_read"]) {
      expect(schema).toMatch(new RegExp(`${policy}\\s+on public\\.[^;]*for select`));
    }
  });

  it("limita el grado al rango que atiende el CAM", () => {
    expect(schema).toContain("check (grade between 3 and 6)");
  });

  it("limita el rango de edad a los tres definidos", () => {
    expect(schema).toContain("check (age_range in ('7-9','10-12','12+'))");
  });

  it("impide guardar una opción de perfil que pertenece a otra pregunta", () => {
    expect(schema).toContain("references public.profile_options (id, question_id)");
  });

  it("impide una calificación sin fecha, y viceversa", () => {
    expect(schema).toContain("check ((rating is null) = (rated_at is null))");
  });
});
