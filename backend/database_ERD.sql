-- Create the 'users' table
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Corresponds to Firebase Auth UID
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_career_goal_id UUID -- This will be a foreign key to career_paths.id later
);

-- Create the 'career_paths' table
CREATE TABLE career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    target_skills TEXT[], -- Array of text for skills associated with this path
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint to 'users' table for 'current_career_goal_id'
-- This is done after 'career_paths' is created to ensure the referenced table exists.
ALTER TABLE users
ADD CONSTRAINT fk_current_career_goal
FOREIGN KEY (current_career_goal_id) REFERENCES career_paths(id)
ON DELETE SET NULL; -- If a career path is deleted, users' goal is set to NULL

-- Create the 'user_skills' table (junction table for many-to-many relationship between users and skills)
CREATE TABLE user_skills (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL, -- The name of the skill
    proficiency_level TEXT, -- e.g., 'Beginner', 'Intermediate', 'Advanced'
    PRIMARY KEY (user_id, skill_name) -- Composite primary key
);

-- Create the 'user_learning_paths' table
CREATE TABLE user_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    career_path_id UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
    generated_by_ai_prompt TEXT,
    generated_content_json JSONB, -- Stores the raw JSON output from AI
    status TEXT DEFAULT 'active', -- e.g., 'active', 'archived', 'completed'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the 'learning_items' table
CREATE TABLE learning_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_learning_path_id UUID NOT NULL REFERENCES user_learning_paths(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- e.g., 'topic', 'read', 'watch', 'project', 'practice'
    suggested_resource_url TEXT,
    status TEXT DEFAULT 'pending', -- e.g., 'pending', 'in-progress', 'completed'
    order_index INTEGER, -- Order of the item in the roadmap
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create the 'resources' table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT, -- External URL (e.g., to an article, video, course)
    file_path TEXT, -- Path in Supabase Storage if it's an uploaded file
    type TEXT NOT NULL, -- e.g., 'article', 'video', 'book', 'course', 'document', 'project'
    tags TEXT[], -- Array of keywords/tags
    created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL, -- User who added this resource
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the 'mentors' table
CREATE TABLE mentors (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, -- User ID who is a mentor
    specialties TEXT[], -- Array of skills/topics the mentor can assist with
    availability JSONB, -- Structured data for mentor's availability
    hourly_rate NUMERIC(10, 2), -- Optional
    bio TEXT, -- Mentor-specific bio
    is_active BOOLEAN DEFAULT TRUE -- Whether the mentor is currently active
);

-- Create the 'mentorship_requests' table
CREATE TABLE mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_user_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending', -- e.g., 'pending', 'accepted', 'rejected', 'canceled'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the 'mentorship_sessions' table
CREATE TABLE mentorship_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentee_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_user_id TEXT NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_link TEXT, -- URL for the video call (e.g., Google Meet, Zoom)
    status TEXT DEFAULT 'scheduled', -- e.g., 'scheduled', 'completed', 'canceled'
    notes TEXT, -- Session notes (optional)
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create the 'notifications' table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'new_roadmap', 'mentorship_accepted', 'resource_updated'
    message TEXT NOT NULL,
    link TEXT, -- Optional, link to relevant part of the app
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Optional: Add indexes for frequently queried columns to improve performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_learning_paths_user_id ON user_learning_paths(user_id);
CREATE INDEX idx_learning_items_user_learning_path_id ON learning_items(user_learning_path_id);
CREATE INDEX idx_resources_created_by_user_id ON resources(created_by_user_id);
CREATE INDEX idx_mentorship_requests_mentee_user_id ON mentorship_requests(mentee_user_id);
CREATE INDEX idx_mentorship_requests_mentor_user_id ON mentorship_requests(mentor_user_id);
CREATE INDEX idx_mentorship_sessions_mentee_user_id ON mentorship_sessions(mentee_user_id);
CREATE INDEX idx_mentorship_sessions_mentor_user_id ON mentorship_sessions(mentor_user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);