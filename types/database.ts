export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Los tres rangos que acepta el check de students.age_range. */
export const AGE_RANGES = ["7-9", "10-12", "12+"] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

/** El CAM atiende de 3.º a 6.º de primaria; el check de la base lo impone. */
export const GRADES = [3, 4, 5, 6] as const;
export type Grade = (typeof GRADES)[number];

export type Educator = { id: string; name: string; role: "educator" | "coordinator"; active: boolean };
export type Student = { id: string; name: string; grade: Grade; age_range: AgeRange; profile_comment: string | null; active: boolean; created_at: string };
export type StudentGroup = { id: string; name: string; grade: Grade; school_year: string };
export type Condition = { id: string; name: string; description: string | null };
export type Subject = { id: string; category: string; topic: string; grade: Grade; learning_objective: string | null };

export type ProfileQuestion = { id: string; question: string; help_text: string | null; sort_order: number; active: boolean };
export type ProfileOption = { id: string; question_id: string; label: string; sort_order: number };
/** Una pregunta con sus opciones, como la consume el formulario. */
export type ProfileQuestionWithOptions = ProfileQuestion & { options: ProfileOption[] };
export type ProfileAnswer = { student_id: string; question_id: string; option_id: string; updated_at: string };

export type RecommendationRating = "good" | "bad";
export type Recommendation = {
  id: string;
  student_id: string;
  subject_id: string;
  educator_id: string;
  content: string;
  context: Json;
  model: string;
  rating: RecommendationRating | null;
  comment: string | null;
  rated_at: string | null;
  regenerated_from: string | null;
  created_at: string;
};
