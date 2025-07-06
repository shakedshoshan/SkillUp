-- Course Schema Migration for SkillUp
-- This migration creates the complete course structure based on the models.ts file
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- CREATE TABLE public.users (
--   id uuid NOT NULL DEFAULT gen_random_uuid(),
--   tokens integer DEFAULT 0,
--   skill_score integer DEFAULT 0,
--   CONSTRAINT users_pkey PRIMARY KEY (id),
--   CONSTRAINT users_details_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
-- );

-- Create the 'courses' table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_audience TEXT NOT NULL,
    prerequisites TEXT[] DEFAULT '{}', -- Array of prerequisite strings
    total_duration TEXT NOT NULL, -- e.g., "40 hours", "2 weeks"
    difficulty_level TEXT, -- e.g., 'beginner', 'intermediate', 'advanced'
    tags TEXT[] DEFAULT '{}', -- Array of keywords/tags for the course
    is_published BOOLEAN DEFAULT FALSE, -- Whether the course is publicly available
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who created this course
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the 'course_parts' table
CREATE TABLE IF NOT EXISTS course_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    part_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    learning_goals TEXT[] DEFAULT '{}', -- Array of learning goal strings
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, part_number) -- Ensure unique part numbers per course
);

-- Create the 'course_lessons' table
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_part_id UUID NOT NULL REFERENCES course_parts(id) ON DELETE CASCADE,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(course_part_id, lesson_number) -- Ensure unique lesson numbers per part
);

-- Create the 'lesson_content' table
CREATE TABLE IF NOT EXISTS lesson_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    learning_objectives TEXT[] DEFAULT '{}', -- Array of learning objective strings
    content TEXT NOT NULL, -- Main lesson content
    key_concepts TEXT[] DEFAULT '{}', -- Array of key concept strings
    examples TEXT[] DEFAULT '{}', -- Array of example strings
    exercises TEXT[] DEFAULT '{}', -- Array of exercise strings
    estimated_duration TEXT NOT NULL, -- e.g., "30 minutes", "1 hour"
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id) -- One content per lesson
);

-- Create the 'lesson_quizzes' table
CREATE TABLE IF NOT EXISTS lesson_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(lesson_id) -- One quiz per lesson
);

-- Create the 'quiz_questions' table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL, -- Order of questions in the quiz
    question TEXT NOT NULL,
    explanation TEXT, -- Optional explanation of the correct answer
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(quiz_id, question_number) -- Ensure unique question numbers per quiz
);

-- Create the 'quiz_options' table
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_letter TEXT NOT NULL, -- A, B, C, D
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(question_id, option_letter) -- Ensure unique option letters per question
);

-- Create the 'course_enrollments' table (for tracking user progress)
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completion_date TIMESTAMP WITH TIME ZONE,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_part_number INTEGER DEFAULT 1,
    current_lesson_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, course_id) -- One enrollment per user per course
);

-- Create the 'lesson_completions' table (for tracking individual lesson completions)
CREATE TABLE IF NOT EXISTS lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    quiz_score INTEGER, -- Score out of total questions (e.g., 3 out of 3)
    quiz_total INTEGER, -- Total number of questions in the quiz
    time_spent_minutes INTEGER, -- Time spent on this lesson in minutes
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, lesson_id) -- One completion per user per lesson
);

-- Create indexes for frequently queried columns to improve performance
CREATE INDEX IF NOT EXISTS idx_courses_created_by_user_id ON courses(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty_level ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_course_parts_course_id ON course_parts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_parts_part_number ON course_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_part_id ON course_lessons(course_part_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_lesson_number ON course_lessons(lesson_number);
CREATE INDEX IF NOT EXISTS idx_lesson_content_lesson_id ON lesson_content(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_quizzes_lesson_id ON lesson_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user_id ON lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson_id ON lesson_completions(lesson_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_parts_updated_at BEFORE UPDATE ON course_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_content_updated_at BEFORE UPDATE ON lesson_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_quizzes_updated_at BEFORE UPDATE ON lesson_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quiz_options_updated_at BEFORE UPDATE ON quiz_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (public read for published courses, owner can edit)
CREATE POLICY "Public courses are viewable by everyone" ON courses
    FOR SELECT USING (is_published = true);

CREATE POLICY "Users can view their own courses" ON courses
    FOR SELECT USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can create courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own courses" ON courses
    FOR UPDATE USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own courses" ON courses
    FOR DELETE USING (auth.uid() = created_by_user_id);

-- RLS Policies for course parts (inherit from course visibility)
CREATE POLICY "Course parts are viewable if course is viewable" ON course_parts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_parts.course_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage parts" ON course_parts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = course_parts.course_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- RLS Policies for course lessons (inherit from course visibility)
CREATE POLICY "Course lessons are viewable if course is viewable" ON course_lessons
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            WHERE course_parts.id = course_lessons.course_part_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage lessons" ON course_lessons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            WHERE course_parts.id = course_lessons.course_part_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- RLS Policies for lesson content (inherit from course visibility)
CREATE POLICY "Lesson content is viewable if course is viewable" ON lesson_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            WHERE course_lessons.id = lesson_content.lesson_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage lesson content" ON lesson_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            WHERE course_lessons.id = lesson_content.lesson_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- RLS Policies for quizzes and questions (inherit from course visibility)
CREATE POLICY "Quizzes are viewable if course is viewable" ON lesson_quizzes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            WHERE course_lessons.id = lesson_quizzes.lesson_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage quizzes" ON lesson_quizzes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            WHERE course_lessons.id = lesson_quizzes.lesson_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- Similar policies for quiz_questions and quiz_options
CREATE POLICY "Quiz questions are viewable if course is viewable" ON quiz_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            JOIN lesson_quizzes ON course_lessons.id = lesson_quizzes.lesson_id
            WHERE lesson_quizzes.id = quiz_questions.quiz_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage quiz questions" ON quiz_questions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            JOIN lesson_quizzes ON course_lessons.id = lesson_quizzes.lesson_id
            WHERE lesson_quizzes.id = quiz_questions.quiz_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

CREATE POLICY "Quiz options are viewable if course is viewable" ON quiz_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            JOIN lesson_quizzes ON course_lessons.id = lesson_quizzes.lesson_id
            JOIN quiz_questions ON lesson_quizzes.id = quiz_questions.quiz_id
            WHERE quiz_questions.id = quiz_options.question_id 
            AND (courses.is_published = true OR courses.created_by_user_id = auth.uid())
        )
    );

CREATE POLICY "Course owners can manage quiz options" ON quiz_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM courses 
            JOIN course_parts ON courses.id = course_parts.course_id
            JOIN course_lessons ON course_parts.id = course_lessons.course_part_id
            JOIN lesson_quizzes ON course_lessons.id = lesson_quizzes.lesson_id
            JOIN quiz_questions ON lesson_quizzes.id = quiz_questions.quiz_id
            WHERE quiz_questions.id = quiz_options.question_id 
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- RLS Policies for enrollments (users can only see their own enrollments)
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments" ON course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for lesson completions (users can only see their own completions)
CREATE POLICY "Users can view their own lesson completions" ON lesson_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson completions" ON lesson_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson completions" ON lesson_completions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Record this migration
INSERT INTO migration_history (migration_name) 
VALUES ('002_course_schema') 
ON CONFLICT (migration_name) DO NOTHING; 
