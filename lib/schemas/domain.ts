import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().trim().min(2, "Escribe un nombre.").max(80),
  educationalLevel: z.string().min(1),
  academicGrade: z.string().min(1),
  schoolCycle: z.string().trim().max(20).optional(),
});

export const studentSchema = z.object({
  groupId: z.uuid(),
  nickname: z.string().trim().min(1).max(80),
  ageValue: z.number().int().min(3).max(30).nullable(),
  ageRange: z.string().max(30).nullable(),
  educationalLevel: z.string().min(1),
  enrolledGrade: z.string().min(1),
  conditionIds: z.array(z.uuid()).min(1, "Selecciona al menos una condición."),
}).refine((data) => Boolean(data.ageValue) !== Boolean(data.ageRange), {
  message: "Indica una edad o un rango de edad, no ambos.", path: ["ageValue"],
});

const nonEmptyArray = z.array(z.string().min(1)).min(1);
export const learningProfileSchema = z.object({
  studentId: z.uuid(),
  preferredInstructionFormats: nonEmptyArray,
  instructionSteps: z.string().min(1),
  preferredParticipation: z.string().min(1),
  attentionRange: z.string().min(1),
  needsBreaks: z.string().min(1),
  responseMethods: nonEmptyArray,
  interests: nonEmptyArray,
  preferredMaterials: nonEmptyArray,
  successfulSupports: nonEmptyArray,
  educatorNote: z.string().trim().max(500).nullable(),
});

export const activityRequestSchema = z.object({
  groupId: z.uuid(), subjectId: z.uuid(), topicId: z.uuid(),
  selectedStudentIds: z.array(z.uuid()).min(1),
  durationMinutes: z.number().int().min(5).max(180).nullable(),
  availableMaterials: z.array(z.string().min(1)).max(20),
  extraInstructions: z.string().trim().max(500).nullable(),
});

export const feedbackSchema = z.object({
  activityOptionId: z.uuid(), rating: z.number().int().min(1).max(5),
  modificationComment: z.string().trim().min(3).max(500),
});

export const activityStatuses = ["generated", "discarded", "edited", "accepted", "applied", "evaluated", "archived"] as const;
export const activityStatusSchema = z.enum(activityStatuses);
