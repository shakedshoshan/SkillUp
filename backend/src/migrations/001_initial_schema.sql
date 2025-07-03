-- Initial Schema Migration for SkillUp
-- This migration creates only the core tables: users and course

-- Create the 'users' table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Corresponds to Supabase Auth UID
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    tokens INTEGER DEFAULT 0,
    skill_score INTEGER DEFAULT 0,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -- Create the 'course' table
-- CREATE TABLE IF NOT EXISTS course (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     title TEXT NOT NULL,
--     description TEXT,
--     content JSONB, -- Stores the complete course content as JSON
--     difficulty_level TEXT, -- e.g., 'beginner', 'intermediate', 'advanced'
--     estimated_duration_hours INTEGER, -- Estimated time to complete in hours
--     tags TEXT[], -- Array of keywords/tags for the course
--     is_published BOOLEAN DEFAULT FALSE, -- Whether the course is publicly available
--     created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- User who created this course
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
-- );

-- -- Create indexes for frequently queried columns to improve performance
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_course_created_by_user_id ON course(created_by_user_id);
-- CREATE INDEX IF NOT EXISTS idx_course_is_published ON course(is_published);
-- CREATE INDEX IF NOT EXISTS idx_course_difficulty_level ON course(difficulty_level);

-- -- Create migration tracking table
-- CREATE TABLE IF NOT EXISTS migration_history (
--     id SERIAL PRIMARY KEY,
--     migration_name TEXT NOT NULL UNIQUE,
--     executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
-- );

-- -- Record this migration
-- INSERT INTO migration_history (migration_name) 
-- VALUES ('001_initial_schema') 
-- ON CONFLICT (migration_name) DO NOTHING; 