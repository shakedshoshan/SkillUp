interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  difficulty?: string;
  estimated_hours?: number;
  price?: number;
  currency?: string;
  is_published: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  // Additional fields from database
  target_audience?: string;
  prerequisites?: string[];
  total_duration?: string;
  difficulty_level?: string;
  tags?: string[];
  parts?: CoursePart[];
}

interface QuizOption {
  id: string;
  option_letter: string;
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: string;
  question_number: number;
  question: string;
  explanation?: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

interface LessonContent {
  id: string;
  title: string;
  learning_objectives: string[];
  content: string;
  key_concepts: string[];
  examples: string[];
  exercises: string[];
  estimated_duration: string;
}

interface Lesson {
  id: string;
  lesson_number: number;
  title: string;
  description: string;
  content: LessonContent | null;
  quiz: Quiz | null;
}

interface CoursePart {
  id: string;
  part_number: number;
  title: string;
  description: string;
  learning_goals: string[];
  lessons: Lesson[];
}

interface CourseResponse {
  success: boolean;
  data: Course[];
  count: number;
  user_id: string;
}

// New interfaces for course doing flow
interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: string;
  completion_date?: string;
  progress_percentage: number;
  current_part_number: number;
  current_lesson_number: number;
  created_at: string;
  updated_at: string;
}

interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
  quiz_score?: number;
  quiz_total?: number;
  time_spent_minutes?: number;
}

interface QuizSubmission {
  quiz_id: string;
  answers: {
    question_id: string;
    selected_option_id: string;
  }[];
}

interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  results: {
    question_id: string;
    correct: boolean;
    selected_option_id: string;
    correct_option_id: string;
  }[];
}

export class CourseService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_BACKEND_URL_PROD
    : process.env.NEXT_PUBLIC_BACKEND_URL;

  static async getCoursesByUser(userId: string): Promise<CourseResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  }

  static async getCourseById(courseId: string) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/${courseId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }

  // Course Enrollment APIs
  static async enrollInCourse(userId: string, courseId: string): Promise<{ success: boolean; data?: CourseEnrollment; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to enroll in course: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  }

  static async getCourseEnrollment(userId: string, courseId: string): Promise<{ success: boolean; data?: CourseEnrollment; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/${courseId}/enrollment/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Not enrolled' };
        }
        throw new Error(`Failed to fetch enrollment: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      throw error;
    }
  }

  static async updateProgress(userId: string, courseId: string, partNumber: number, lessonNumber: number): Promise<{ success: boolean; data?: CourseEnrollment; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId, 
          current_part_number: partNumber,
          current_lesson_number: lessonNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update progress: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  }

  // Lesson Completion APIs
  static async completeLesson(userId: string, lessonId: string, timeSpentMinutes?: number): Promise<{ success: boolean; data?: LessonCompletion; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId, 
          time_spent_minutes: timeSpentMinutes 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to complete lesson: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error completing lesson:', error);
      throw error;
    }
  }

  static async getLessonCompletion(userId: string, lessonId: string): Promise<{ success: boolean; data?: LessonCompletion; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/lessons/${lessonId}/completion/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Not completed' };
        }
        throw new Error(`Failed to fetch lesson completion: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching lesson completion:', error);
      throw error;
    }
  }

  // Quiz APIs
  static async submitQuiz(userId: string, lessonId: string, quizSubmission: QuizSubmission): Promise<{ success: boolean; data?: QuizResult; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/lessons/${lessonId}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userId, 
          ...quizSubmission 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit quiz: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }

  // Get user's enrolled courses
  static async getEnrolledCourses(userId: string): Promise<{ success: boolean; data?: (Course & { enrollment: CourseEnrollment })[]; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/users/${userId}/enrolled-courses`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch enrolled courses: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  }

  // Get all lesson completions for a course (more efficient than individual calls)
  static async getCourseCompletions(userId: string, courseId: string): Promise<{ success: boolean; data?: LessonCompletion[]; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/courses/${courseId}/completions/${userId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: [] }; // No completions yet
        }
        throw new Error(`Failed to fetch course completions: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching course completions:', error);
      throw error;
    }
  }
}

export type { 
  Course, 
  CourseResponse, 
  CoursePart, 
  Lesson, 
  LessonContent, 
  Quiz, 
  QuizQuestion, 
  QuizOption,
  CourseEnrollment,
  LessonCompletion,
  QuizSubmission,
  QuizResult
}; 