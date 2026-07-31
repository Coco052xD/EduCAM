-- EduCAM — esquema inicial.
-- Documentación completa del modelo y sus decisiones: ../../DATABASE.md
--
-- Contexto de seguridad: la base guarda datos de salud de menores de edad.
-- RLS va habilitado en todas las tablas desde el minuto cero, y los grants son
-- explícitos porque service_role NO recibe permisos automáticos cuando el
-- proyecto tiene "expose new tables" apagado (una Edge Function daría 503).

-- ── Educators (login) ─────────────────────────────────────
-- email y password viven en auth.users; duplicarlos crearía dos fuentes de
-- verdad sobre la credencial.
create table public.educators (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  role        text not null default 'educator'
              check (role in ('educator','coordinator')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Students ──────────────────────────────────────────────
-- age_range en vez de fecha de nacimiento: el sistema nunca necesita la edad
-- exacta, y menos dato personal de un menor es mejor dato personal de un menor.
create table public.students (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  grade            smallint not null check (grade between 3 and 6),
  age_range        text not null check (age_range in ('7-9','10-12','12+')),
  profile_comment  text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ── Conditions ────────────────────────────────────────────
create table public.conditions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  description  text
);

create table public.student_conditions (
  student_id    uuid references public.students on delete cascade,
  condition_id  uuid references public.conditions,
  notes         text,
  primary key (student_id, condition_id)
);

-- ── Perfil de aprendizaje (formulario de opción múltiple) ──
create table public.profile_questions (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  help_text   text,
  sort_order  smallint not null,
  active      boolean not null default true
);

create table public.profile_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.profile_questions on delete cascade,
  label        text not null,
  sort_order   smallint not null,
  unique (id, question_id)                     -- soporta el FK compuesto de abajo
);
create index on public.profile_options (question_id);

-- El FK compuesto (option_id, question_id) impide guardar una opción que
-- pertenece a otra pregunta. Sin él, un bug de UI corrompe el perfil en
-- silencio: la base acepta la fila, el formulario se ve bien, y Gemma recibe
-- un perfil incoherente sin que nadie se entere.
create table public.student_profile_answers (
  student_id   uuid references public.students on delete cascade,
  question_id  uuid not null,
  option_id    uuid not null,
  updated_at   timestamptz not null default now(),
  primary key (student_id, question_id),       -- una respuesta por pregunta
  foreign key (question_id) references public.profile_questions,
  foreign key (option_id, question_id)
    references public.profile_options (id, question_id)
);

-- ── Subjects ──────────────────────────────────────────────
create table public.subjects (
  id        uuid primary key default gen_random_uuid(),
  category  text not null,
  topic     text not null,
  grade     smallint not null check (grade between 3 and 6),
  unique (category, topic, grade)
);

-- ── Grupos y clases ───────────────────────────────────────
create table public.student_groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  grade        smallint not null check (grade between 3 and 6),
  school_year  text not null,
  unique (name, school_year)
);

create table public.student_group_members (
  group_id    uuid references public.student_groups on delete cascade,
  student_id  uuid references public.students on delete cascade,
  primary key (group_id, student_id)
);

create table public.classes (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.student_groups on delete cascade,
  subject_id   uuid not null references public.subjects,
  educator_id  uuid not null references public.educators,
  unique (group_id, subject_id)
);

-- ── Recommendations ───────────────────────────────────────
-- context es un snapshot del perfil + padecimientos + grado usados al generar.
-- El perfil cambia con el tiempo: sin el snapshot, una recomendación calificada
-- como buena no sirve como ejemplo few-shot porque no sabrías con qué
-- información se produjo.
create table public.recommendations (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references public.students on delete cascade,
  subject_id        uuid not null references public.subjects,
  educator_id       uuid not null references public.educators,
  content           text not null,
  context           jsonb not null,
  model             text not null,
  rating            text check (rating in ('good','bad')),
  comment           text,
  rated_at          timestamptz,
  regenerated_from  uuid references public.recommendations(id),
  created_at        timestamptz not null default now(),
  check ((rating is null) = (rated_at is null))
);
create index on public.recommendations (student_id, subject_id, created_at desc);
create index on public.recommendations (subject_id) where rating = 'good';

-- ── RLS ───────────────────────────────────────────────────
-- Escuela única: todo educador activo ve a todos los alumnos. La política
-- existe porque es lo que bloquea al rol anon — la anon key es pública, va en
-- el bundle del frontend, y sin RLS cualquiera con ella lee los expedientes.
create function public.is_active_educator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.educators
                 where id = auth.uid() and active)
$$;

alter table public.educators               enable row level security;
alter table public.students                enable row level security;
alter table public.student_conditions      enable row level security;
alter table public.student_profile_answers enable row level security;
alter table public.student_groups          enable row level security;
alter table public.student_group_members   enable row level security;
alter table public.classes                 enable row level security;
alter table public.recommendations         enable row level security;

create policy educators_rw on public.educators               for all to authenticated using (public.is_active_educator());
create policy students_rw  on public.students                for all to authenticated using (public.is_active_educator());
create policy conds_rw     on public.student_conditions      for all to authenticated using (public.is_active_educator());
create policy answers_rw   on public.student_profile_answers for all to authenticated using (public.is_active_educator());
create policy groups_rw    on public.student_groups          for all to authenticated using (public.is_active_educator());
create policy members_rw   on public.student_group_members   for all to authenticated using (public.is_active_educator());
create policy classes_rw   on public.classes                 for all to authenticated using (public.is_active_educator());
create policy recs_rw      on public.recommendations         for all to authenticated using (public.is_active_educator());

-- Catálogos: lectura para el cliente, escritura solo desde el servidor.
alter table public.conditions        enable row level security;
alter table public.subjects          enable row level security;
alter table public.profile_questions enable row level security;
alter table public.profile_options   enable row level security;

create policy conditions_read on public.conditions        for select to authenticated using (true);
create policy subjects_read   on public.subjects          for select to authenticated using (true);
create policy questions_read  on public.profile_questions for select to authenticated using (true);
create policy options_read    on public.profile_options   for select to authenticated using (true);

-- ── Grants explícitos ─────────────────────────────────────
-- service_role: lo usan las Edge Functions (bypassa RLS, pero necesita grants).
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

grant select, insert, update, delete on
  public.educators, public.students, public.student_conditions,
  public.student_profile_answers, public.student_groups,
  public.student_group_members, public.classes, public.recommendations
  to authenticated;

grant select on
  public.conditions, public.subjects,
  public.profile_questions, public.profile_options
  to authenticated;

grant execute on function public.is_active_educator() to authenticated, service_role;
