export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Group = { id: string; name: string; educational_level: string; academic_grade: string; school_cycle: string | null; active: boolean; created_at: string };
export type Student = { id: string; group_id: string; nickname: string; age_value: number | null; age_range: string | null; educational_level: string; enrolled_grade: string; active: boolean; created_at: string };
export type Subject = { id: string; educational_level: string; academic_grade: string; name: string; formative_field: string | null; curriculum_version: string };
export type Topic = { id: string; subject_id: string; name: string; learning_objective: string };
export type ActivityOption = { id: string; activity_request_id: string; generation_number: number; activity_type: string | null; activity_data: Json; status: string; pre_application_rating: number | null; discard_reason: string | null; created_at: string };
