import { z } from "zod";
import { AGE_RANGES, GRADES } from "@/types/database";

const grade = z.coerce
  .number()
  .int()
  .refine((value) => (GRADES as readonly number[]).includes(value), "El CAM atiende de 3.º a 6.º de primaria.");

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(80),
  grade,
  schoolYear: z.string().trim().regex(/^\d{4}-\d{4}$/, "Usa el formato 2025-2026."),
});

export const studentSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre.").max(80),
  grade,
  ageRange: z.enum(AGE_RANGES),
  groupId: z.uuid("Selecciona un grupo."),
  conditionIds: z.array(z.uuid()).min(1, "Selecciona al menos un padecimiento."),
  profileComment: z.string().trim().max(500).nullable(),
});

/**
 * El formulario de perfil no es fijo: preguntas y opciones viven en la base.
 * Se valida como un mapa pregunta -> opción; que la opción pertenezca a esa
 * pregunta lo garantiza el FK compuesto de la base, no zod.
 */
export const learningProfileSchema = z.object({
  studentId: z.uuid(),
  answers: z
    .record(z.uuid(), z.uuid())
    .refine((value) => Object.keys(value).length > 0, "Responde el formulario."),
});

export const recommendationRequestSchema = z.object({
  studentId: z.uuid("Selecciona un alumno."),
  subjectId: z.uuid("Selecciona un tema."),
  refinement: z.string().trim().max(300).optional(),
});

export const feedbackSchema = z.object({
  recommendationId: z.uuid(),
  rating: z.enum(["good", "bad"]),
  comment: z.string().trim().max(500).nullable(),
});
