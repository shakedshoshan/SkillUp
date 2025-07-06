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

export class CourseService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://skillup-backend.vercel.app' 
    : 'http://localhost:5000';

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
}

export type { 
  Course, 
  CourseResponse, 
  CoursePart, 
  Lesson, 
  LessonContent, 
  Quiz, 
  QuizQuestion, 
  QuizOption 
}; 