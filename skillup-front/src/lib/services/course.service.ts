interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimated_hours: number;
  price: number;
  currency: string;
  is_published: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
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

export type { Course, CourseResponse }; 