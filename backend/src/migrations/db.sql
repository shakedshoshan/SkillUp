-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id text NOT NULL,
  email text NOT NULL UNIQUE,
  username text UNIQUE,
  full_name text,
  bio text,
  tokens integer DEFAULT 0,
  skill_score integer DEFAULT 0,
  profile_picture_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  firebase_id text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);