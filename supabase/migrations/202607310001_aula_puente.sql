begin;

create extension if not exists pgcrypto;
create schema if not exists app;
create schema if not exists knowledge;
create schema if not exists curriculum;

grant usage on schema app, knowledge, curriculum to authenticated, service_role;

create table app.educator_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  grades_taught text[] not null default '{}',
  subjects_taught text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.groups (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  educational_level text not null,
  academic_grade text not null,
  school_cycle text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, educator_id)
);

create table app.students (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null,
  nickname text not null check (char_length(nickname) between 1 and 80),
  age_value integer check (age_value between 3 and 30),
  age_range text check (char_length(age_range) <= 30),
  educational_level text not null,
  enrolled_grade text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (group_id, educator_id) references app.groups(id, educator_id) on delete cascade,
  check ((age_value is not null) <> (age_range is not null)),
  unique (id, educator_id)
);

create table knowledge.conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table knowledge.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  organization text,
  url text,
  publication_year integer,
  reviewed_at timestamptz,
  active boolean not null default true
);

create table knowledge.recommendations (
  id uuid primary key default gen_random_uuid(),
  condition_id uuid not null references knowledge.conditions(id) on delete cascade,
  age_min integer,
  age_max integer,
  educational_level text,
  grade_min text,
  grade_max text,
  category text not null,
  recommendation text not null,
  applicability text,
  do_not_assume text,
  source_id uuid references knowledge.sources(id) on delete set null,
  validation_status text not null default 'draft' check (validation_status in ('draft','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (age_min is null or age_max is null or age_min <= age_max)
);

create table app.student_conditions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references app.students(id) on delete cascade,
  condition_id uuid not null references knowledge.conditions(id),
  created_at timestamptz not null default now(),
  unique (student_id, condition_id)
);

create table app.learning_profiles (
  id uuid primary key default gen_random_uuid(),
  student_id uuid unique not null references app.students(id) on delete cascade,
  preferred_instruction_formats text[] not null default '{}',
  instruction_steps text not null,
  preferred_participation text not null,
  attention_range text not null,
  needs_breaks text not null,
  response_methods text[] not null default '{}',
  interests text[] not null default '{}',
  preferred_materials text[] not null default '{}',
  successful_supports text[] not null default '{}',
  educator_note text check (char_length(educator_note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table curriculum.subjects (
  id uuid primary key default gen_random_uuid(),
  educational_level text not null,
  academic_grade text not null,
  name text not null,
  formative_field text,
  curriculum_version text not null,
  active boolean not null default true,
  unique (educational_level, academic_grade, name, curriculum_version)
);

create table curriculum.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references curriculum.subjects(id) on delete cascade,
  name text not null,
  learning_objective text not null,
  source_reference text,
  active boolean not null default true,
  unique (subject_id, name)
);

create table app.activity_requests (
  id uuid primary key default gen_random_uuid(),
  educator_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid not null,
  subject_id uuid not null references curriculum.subjects(id),
  topic_id uuid not null references curriculum.topics(id),
  selected_student_ids uuid[] not null check (cardinality(selected_student_ids) > 0),
  duration_minutes integer check (duration_minutes between 5 and 180),
  available_materials text[] not null default '{}',
  extra_instructions text check (char_length(extra_instructions) <= 500),
  status text not null default 'pending' check (status in ('pending','generating','completed','failed','rate_limited')),
  error_message text,
  created_at timestamptz not null default now(),
  foreign key (group_id, educator_id) references app.groups(id, educator_id)
);

create table app.activity_options (
  id uuid primary key default gen_random_uuid(),
  activity_request_id uuid not null references app.activity_requests(id) on delete cascade,
  generation_number integer not null check (generation_number > 0),
  activity_type text check (activity_type in ('visual','manipulative','collaborative','playful','mixed')),
  activity_data jsonb not null,
  model_name text not null,
  prompt_version text not null,
  status text not null default 'generated' check (status in ('generated','discarded','edited','accepted','applied','evaluated','archived')),
  pre_application_rating integer check (pre_application_rating between 1 and 5),
  discard_reason text check (char_length(discard_reason) <= 300),
  created_at timestamptz not null default now(),
  unique (activity_request_id, generation_number)
);

create table app.activity_feedback (
  id uuid primary key default gen_random_uuid(),
  activity_option_id uuid unique not null references app.activity_options(id) on delete cascade,
  educator_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  modification_comment text not null check (char_length(modification_comment) between 3 and 500),
  created_at timestamptz not null default now()
);

create table app.activity_application_history (
  id uuid primary key default gen_random_uuid(),
  activity_option_id uuid not null references app.activity_options(id) on delete cascade,
  educator_id uuid not null references auth.users(id) on delete cascade,
  applied_at timestamptz not null default now(),
  unique (activity_option_id)
);

create table app.audit_logs (
  id bigint generated always as identity primary key,
  educator_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index students_group_idx on app.students(group_id) where active;
create index requests_educator_created_idx on app.activity_requests(educator_id, created_at desc);
create index options_request_idx on app.activity_options(activity_request_id);
create unique index one_selected_activity_per_request on app.activity_options(activity_request_id) where status in ('edited','accepted','applied','evaluated');
create index recommendations_match_idx on knowledge.recommendations(condition_id, validation_status, educational_level);

create or replace function app.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger educator_profiles_updated before update on app.educator_profiles for each row execute function app.set_updated_at();
create trigger students_updated before update on app.students for each row execute function app.set_updated_at();
create trigger learning_profiles_updated before update on app.learning_profiles for each row execute function app.set_updated_at();
create trigger recommendations_updated before update on knowledge.recommendations for each row execute function app.set_updated_at();

create or replace function app.validate_activity_request() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if exists (
    select 1 from unnest(new.selected_student_ids) sid
    where not exists (select 1 from app.students s where s.id = sid and s.educator_id = new.educator_id and s.group_id = new.group_id and s.active)
  ) then raise exception 'Todos los alumnos deben pertenecer al grupo y al educador'; end if;
  if not exists (select 1 from curriculum.topics t where t.id = new.topic_id and t.subject_id = new.subject_id and t.active) then
    raise exception 'El tema no pertenece a la materia seleccionada';
  end if;
  return new;
end; $$;
create trigger validate_activity_request_before_insert before insert or update on app.activity_requests for each row execute function app.validate_activity_request();

create or replace function app.validate_activity_status_transition() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status = 'generated' and new.status in ('discarded','edited','accepted','archived')) or
    (old.status = 'edited' and new.status in ('accepted','applied','archived')) or
    (old.status = 'accepted' and new.status in ('edited','applied','archived')) or
    (old.status = 'applied' and new.status = 'evaluated') or
    (old.status in ('evaluated','discarded') and new.status = 'archived')
  ) then raise exception 'Transición de estado inválida: % -> %', old.status, new.status; end if;
  return new;
end; $$;
create trigger validate_activity_option_status before update of status on app.activity_options for each row execute function app.validate_activity_status_transition();

alter table app.educator_profiles enable row level security;
alter table app.groups enable row level security;
alter table app.students enable row level security;
alter table app.student_conditions enable row level security;
alter table app.learning_profiles enable row level security;
alter table app.activity_requests enable row level security;
alter table app.activity_options enable row level security;
alter table app.activity_feedback enable row level security;
alter table app.activity_application_history enable row level security;
alter table app.audit_logs enable row level security;
alter table knowledge.conditions enable row level security;
alter table knowledge.sources enable row level security;
alter table knowledge.recommendations enable row level security;
alter table curriculum.subjects enable row level security;
alter table curriculum.topics enable row level security;

create policy educator_owns_profile on app.educator_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy educator_owns_groups on app.groups for all to authenticated using (educator_id = (select auth.uid())) with check (educator_id = (select auth.uid()));
create policy educator_owns_students on app.students for all to authenticated using (educator_id = (select auth.uid())) with check (educator_id = (select auth.uid()));
create policy educator_owns_student_conditions on app.student_conditions for all to authenticated
  using (exists (select 1 from app.students s where s.id = student_id and s.educator_id = (select auth.uid())))
  with check (exists (select 1 from app.students s where s.id = student_id and s.educator_id = (select auth.uid())));
create policy educator_owns_learning_profiles on app.learning_profiles for all to authenticated
  using (exists (select 1 from app.students s where s.id = student_id and s.educator_id = (select auth.uid())))
  with check (exists (select 1 from app.students s where s.id = student_id and s.educator_id = (select auth.uid())));
create policy educator_owns_requests on app.activity_requests for all to authenticated using (educator_id = (select auth.uid())) with check (educator_id = (select auth.uid()));
create policy educator_owns_options on app.activity_options for all to authenticated
  using (exists (select 1 from app.activity_requests r where r.id = activity_request_id and r.educator_id = (select auth.uid())))
  with check (exists (select 1 from app.activity_requests r where r.id = activity_request_id and r.educator_id = (select auth.uid())));
create policy educator_owns_feedback on app.activity_feedback for all to authenticated using (educator_id = (select auth.uid())) with check (
  educator_id = (select auth.uid()) and exists (
    select 1 from app.activity_options o join app.activity_requests r on r.id = o.activity_request_id
    where o.id = activity_option_id and r.educator_id = (select auth.uid())
  )
);
create policy educator_owns_application_history on app.activity_application_history for all to authenticated using (educator_id = (select auth.uid())) with check (
  educator_id = (select auth.uid()) and exists (
    select 1 from app.activity_options o join app.activity_requests r on r.id = o.activity_request_id
    where o.id = activity_option_id and r.educator_id = (select auth.uid())
  )
);
create policy educator_reads_audit on app.audit_logs for select to authenticated using (educator_id = (select auth.uid()));
create policy educator_inserts_audit on app.audit_logs for insert to authenticated with check (educator_id = (select auth.uid()));

create policy authenticated_reads_conditions on knowledge.conditions for select to authenticated using (active);
create policy authenticated_reads_sources on knowledge.sources for select to authenticated using (active);
create policy authenticated_reads_approved_recommendations on knowledge.recommendations for select to authenticated using (validation_status = 'approved');
create policy authenticated_reads_subjects on curriculum.subjects for select to authenticated using (active);
create policy authenticated_reads_topics on curriculum.topics for select to authenticated using (active);

grant select, insert, update, delete on all tables in schema app to authenticated;
grant select on all tables in schema knowledge, curriculum to authenticated;
grant all on all tables in schema app, knowledge, curriculum to service_role;
grant usage, select on all sequences in schema app to authenticated, service_role;

create or replace function app.mark_activity_applied(option_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update app.activity_options o set status = 'applied'
  where o.id = option_id and o.status in ('accepted','edited') and exists (
    select 1 from app.activity_requests r where r.id = o.activity_request_id and r.educator_id = (select auth.uid())
  );
  if not found then raise exception 'Actividad no encontrada o estado inválido'; end if;
  insert into app.activity_application_history(activity_option_id, educator_id) values (option_id, (select auth.uid())) on conflict do nothing;
end; $$;
grant execute on function app.mark_activity_applied(uuid) to authenticated;

create or replace function app.save_activity_feedback(option_id uuid, stars integer, comment text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if stars not between 1 and 5 or char_length(comment) not between 3 and 500 then raise exception 'Retroalimentación inválida'; end if;
  if not exists (
    select 1 from app.activity_options o join app.activity_requests r on r.id = o.activity_request_id
    where o.id = option_id and o.status = 'applied' and r.educator_id = (select auth.uid())
  ) then raise exception 'La actividad debe estar aplicada y pertenecer al educador'; end if;
  insert into app.activity_feedback(activity_option_id, educator_id, rating, modification_comment)
  values (option_id, (select auth.uid()), stars, comment)
  on conflict (activity_option_id) do update set rating = excluded.rating, modification_comment = excluded.modification_comment;
  update app.activity_options set status = 'evaluated' where id = option_id;
end; $$;
grant execute on function app.save_activity_feedback(uuid, integer, text) to authenticated;

commit;
