export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username?: string
          full_name?: string
          bio?: string
          tokens?: number
          skill_score?: number
          profile_picture_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username?: string
          full_name?: string
          bio?: string
          tokens?: number
          skill_score?: number
          profile_picture_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string
          bio?: string
          tokens?: number
          skill_score?: number
          profile_picture_url?: string
          created_at?: string
          updated_at?: string
          firebase_id?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string
          target_audience: string
          prerequisites: string[]
          total_duration: string
          difficulty_level?: string
          tags: string[]
          is_published: boolean
          created_by_user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          target_audience: string
          prerequisites?: string[]
          total_duration: string
          difficulty_level?: string
          tags?: string[]
          is_published?: boolean
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          target_audience?: string
          prerequisites?: string[]
          total_duration?: string
          difficulty_level?: string
          tags?: string[]
          is_published?: boolean
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      course_parts: {
        Row: {
          id: string
          course_id: string
          part_number: number
          title: string
          description: string
          learning_goals: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          part_number: number
          title: string
          description: string
          learning_goals?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          part_number?: number
          title?: string
          description?: string
          learning_goals?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      course_lessons: {
        Row: {
          id: string
          course_part_id: string
          lesson_number: number
          title: string
          description: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_part_id: string
          lesson_number: number
          title: string
          description: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_part_id?: string
          lesson_number?: number
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
        }
      }
      lesson_content: {
        Row: {
          id: string
          lesson_id: string
          title: string
          learning_objectives: string[]
          content: string
          key_concepts: string[]
          examples: string[]
          exercises: string[]
          estimated_duration: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          title: string
          learning_objectives?: string[]
          content: string
          key_concepts?: string[]
          examples?: string[]
          exercises?: string[]
          estimated_duration: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          title?: string
          learning_objectives?: string[]
          content?: string
          key_concepts?: string[]
          examples?: string[]
          exercises?: string[]
          estimated_duration?: string
          created_at?: string
          updated_at?: string
        }
      }
      lesson_quizzes: {
        Row: {
          id: string
          lesson_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question_number: number
          question: string
          explanation?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question_number: number
          question: string
          explanation?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question_number?: number
          question?: string
          explanation?: string
          created_at?: string
          updated_at?: string
        }
      }
      quiz_options: {
        Row: {
          id: string
          question_id: string
          option_letter: string
          option_text: string
          is_correct: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question_id: string
          option_letter: string
          option_text: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          option_letter?: string
          option_text?: string
          is_correct?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      course_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          enrollment_date: string
          completion_date?: string
          progress_percentage: number
          current_part_number: number
          current_lesson_number: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          enrollment_date?: string
          completion_date?: string
          progress_percentage?: number
          current_part_number?: number
          current_lesson_number?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          enrollment_date?: string
          completion_date?: string
          progress_percentage?: number
          current_part_number?: number
          current_lesson_number?: number
          created_at?: string
          updated_at?: string
        }
      }
      lesson_completions: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string
          quiz_score?: number
          quiz_total?: number
          time_spent_minutes?: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string
          quiz_score?: number
          quiz_total?: number
          time_spent_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string
          quiz_score?: number
          quiz_total?: number
          time_spent_minutes?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type User = Database['public']['Tables']['users']['Row'] 

// Course-related types
export type Course = Database['public']['Tables']['courses']['Row']
export type CoursePart = Database['public']['Tables']['course_parts']['Row']
export type CourseLesson = Database['public']['Tables']['course_lessons']['Row']
export type LessonContent = Database['public']['Tables']['lesson_content']['Row']
export type LessonQuiz = Database['public']['Tables']['lesson_quizzes']['Row']
export type QuizQuestion = Database['public']['Tables']['quiz_questions']['Row']
export type QuizOption = Database['public']['Tables']['quiz_options']['Row']
export type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row']
export type LessonCompletion = Database['public']['Tables']['lesson_completions']['Row']

// Insert types for creating new records
export type CourseInsert = Database['public']['Tables']['courses']['Insert']
export type CoursePartInsert = Database['public']['Tables']['course_parts']['Insert']
export type CourseLessonInsert = Database['public']['Tables']['course_lessons']['Insert']
export type LessonContentInsert = Database['public']['Tables']['lesson_content']['Insert']
export type LessonQuizInsert = Database['public']['Tables']['lesson_quizzes']['Insert']
export type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert']
export type QuizOptionInsert = Database['public']['Tables']['quiz_options']['Insert']
export type CourseEnrollmentInsert = Database['public']['Tables']['course_enrollments']['Insert']
export type LessonCompletionInsert = Database['public']['Tables']['lesson_completions']['Insert']

// Update types for updating existing records
export type CourseUpdate = Database['public']['Tables']['courses']['Update']
export type CoursePartUpdate = Database['public']['Tables']['course_parts']['Update']
export type CourseLessonUpdate = Database['public']['Tables']['course_lessons']['Update']
export type LessonContentUpdate = Database['public']['Tables']['lesson_content']['Update']
export type LessonQuizUpdate = Database['public']['Tables']['lesson_quizzes']['Update']
export type QuizQuestionUpdate = Database['public']['Tables']['quiz_questions']['Update']
export type QuizOptionUpdate = Database['public']['Tables']['quiz_options']['Update']
export type CourseEnrollmentUpdate = Database['public']['Tables']['course_enrollments']['Update']
export type LessonCompletionUpdate = Database['public']['Tables']['lesson_completions']['Update']

// Extended types with relationships for easier use in components
export type CourseWithParts = Course & {
  course_parts: (CoursePart & {
    course_lessons: (CourseLesson & {
      lesson_content?: LessonContent
      lesson_quizzes?: LessonQuiz & {
        quiz_questions: (QuizQuestion & {
          quiz_options: QuizOption[]
        })[]
      }
    })[]
  })[]
}

export type CourseWithEnrollment = Course & {
  course_enrollments?: CourseEnrollment[]
}

export type LessonWithContent = CourseLesson & {
  lesson_content?: LessonContent
  lesson_quizzes?: LessonQuiz & {
    quiz_questions: (QuizQuestion & {
      quiz_options: QuizOption[]
    })[]
  }
  lesson_completions?: LessonCompletion[]
}