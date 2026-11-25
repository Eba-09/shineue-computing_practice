-- Computing Practice — Supabase schema.
-- Supabase → SQL Editor → New query → paste everything → Run.

create extension if not exists "pgcrypto";

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade int not null check (grade between 1 and 12),
  mode text not null default 'auto',          -- 'auto' = by date, 'manual' = teacher's choice
  lesson_ids text[] not null default '{}',    -- lessons shown when mode = 'manual'
  show_answers boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  pin text not null,
  created_at timestamptz not null default now()
);
create index if not exists students_class_idx on students(class_id);

create table if not exists lesson_links (
  lesson_id text primary key,
  slide_url text not null,
  updated_at timestamptz not null default now()
);

create table if not exists progress (
  student_id uuid not null references students(id) on delete cascade,
  lesson_id text not null,
  exercise_id text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'open',        -- open | solved | timeout
  attempts int not null default 0,
  primary key (student_id, lesson_id, exercise_id)
);
create index if not exists progress_lesson_idx on progress(lesson_id);

create table if not exists attempts (
  id bigserial primary key,
  student_id uuid not null references students(id) on delete cascade,
  lesson_id text not null,
  exercise_id text not null,
  answer text,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists attempts_lesson_idx on attempts(lesson_id, student_id);

-- The site talks to the database only from the server with the service-role key.
-- Row Level Security is switched on with no policies, so the public anon key can read nothing.
alter table classes enable row level security;
alter table students enable row level security;
alter table lesson_links enable row level security;
alter table progress enable row level security;
alter table attempts enable row level security;
