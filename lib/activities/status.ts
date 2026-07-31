import { activityStatusSchema } from "@/lib/schemas/domain";

const transitions: Record<string, readonly string[]> = {
  generated: ["discarded", "edited", "accepted", "archived"],
  edited: ["accepted", "applied", "archived"],
  accepted: ["edited", "applied", "archived"],
  applied: ["evaluated"],
  evaluated: ["archived"],
  discarded: ["archived"],
  archived: [],
};

export function canTransitionActivity(from: string, to: string) {
  if (!activityStatusSchema.safeParse(from).success || !activityStatusSchema.safeParse(to).success) return false;
  return transitions[from]?.includes(to) ?? false;
}
