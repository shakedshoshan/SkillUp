interface CourseGenerationRequest {
  course_topic: string;
  search_web: boolean;
  user_id: string;
}

interface CourseGenerationResponse {
  success: boolean;
  sessionId?: string;
  error?: string;
}

interface StreamMessage {
  type: 'log' | 'progress' | 'success' | 'error' | 'course_generated';
  message: string;
  data?: unknown;
  timestamp: string;
}

export class CourseGenerationService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://skillup-backend.vercel.app' 
    : process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  /**
   * Start course generation process
   */
  static async startGeneration(request: CourseGenerationRequest): Promise<CourseGenerationResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/course-generation/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting course generation:', error);
      throw error;
    }
  }

  /**
   * Get backend URL for WebSocket connections
   */
  static getBackendUrl(): string {
    return this.API_BASE_URL;
  }
}

export type { 
  CourseGenerationRequest, 
  CourseGenerationResponse, 
  StreamMessage 
}; 