-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.course_enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrollment_date timestamp with time zone NOT NULL DEFAULT now(),
  completion_date timestamp with time zone,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_part_number integer DEFAULT 1,
  current_lesson_number integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT course_enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_part_id uuid NOT NULL,
  lesson_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_lessons_pkey PRIMARY KEY (id),
  CONSTRAINT course_lessons_course_part_id_fkey FOREIGN KEY (course_part_id) REFERENCES public.course_parts(id)
);
CREATE TABLE public.course_parts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  part_number integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  learning_goals ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT course_parts_pkey PRIMARY KEY (id),
  CONSTRAINT course_parts_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  target_audience text NOT NULL,
  prerequisites ARRAY DEFAULT '{}'::text[],
  total_duration text NOT NULL,
  difficulty_level text,
  tags ARRAY DEFAULT '{}'::text[],
  is_published boolean DEFAULT false,
  created_by_user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.lesson_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  quiz_score integer,
  quiz_total integer,
  time_spent_minutes integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_completions_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT lesson_completions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id)
);
CREATE TABLE public.lesson_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE,
  title text NOT NULL,
  learning_objectives ARRAY DEFAULT '{}'::text[],
  content text NOT NULL,
  key_concepts ARRAY DEFAULT '{}'::text[],
  examples ARRAY DEFAULT '{}'::text[],
  exercises ARRAY DEFAULT '{}'::text[],
  estimated_duration text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_content_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_content_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id)
);
CREATE TABLE public.lesson_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lesson_quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id)
);
CREATE TABLE public.migration_history (
  id integer NOT NULL DEFAULT nextval('migration_history_id_seq'::regclass),
  migration_name text NOT NULL UNIQUE,
  executed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT migration_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.quiz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_letter text NOT NULL,
  option_text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quiz_options_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_number integer NOT NULL,
  question text NOT NULL,
  explanation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.lesson_quizzes(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tokens integer DEFAULT 0,
  skill_score integer DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_details_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);