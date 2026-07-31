import { z } from "zod";

export const generatedActivitySchema = z.object({
  title: z.string().min(5).max(150),
  activityType: z.enum(["visual", "manipulative", "collaborative", "playful", "mixed"]),
  objective: z.string().min(10).max(500),
  durationMinutes: z.number().int().min(5).max(180),
  materials: z.array(z.string()).max(20), preparation: z.array(z.string()).max(10),
  steps: z.array(z.object({ order: z.number().int(), instruction: z.string().min(1), estimatedMinutes: z.number().int().min(1), educatorSupport: z.string().min(1) })).min(2).max(12),
  studentAdaptations: z.array(z.object({ studentKey: z.string().regex(/^student_\d{2}$/), recommendations: z.array(z.string()).max(8) })),
  assessment: z.object({ evidence: z.array(z.string()), observationCriteria: z.array(z.string()), responseOptions: z.array(z.string()) }),
  rationale: z.string().max(1000), safetyNotes: z.array(z.string()), requiresHumanReview: z.literal(true),
});

export const generatedActivitiesSchema = z.object({ proposals: z.array(generatedActivitySchema).min(1).max(3) });
export type GeneratedActivity = z.infer<typeof generatedActivitySchema>;
