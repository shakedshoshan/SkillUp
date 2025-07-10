interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

interface ChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'unavailable' | 'error';
  service: string;
  ollama_available: boolean;
  available_models: string[];
  timestamp: string;
  error?: string;
}

interface ChatInfoResponse {
  success: boolean;
  service: string;
  status: 'available' | 'unavailable';
  description: string;
  endpoints: Record<string, string>;
  usage: Record<string, any>;
  timestamp: string;
  error?: string;
}

export class LLMService {
  private static readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_BACKEND_URL_PROD
    : process.env.NEXT_PUBLIC_BACKEND_URL;

  /**
   * Send a message to CourseBot and get a response
   */
  static async chat(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, history } as ChatRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  /**
   * Check the health status of the chat service
   */
  static async getHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking LLM health:', error);
      return {
        success: false,
        status: 'error',
        service: 'CourseBot',
        ollama_available: false,
        available_models: [],
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to check health'
      };
    }
  }


  /**
   * Get chat API information and status
   */
  static async getInfo(): Promise<ChatInfoResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat/info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching chat info:', error);
      return {
        success: false,
        service: 'CourseBot Chat API',
        status: 'unavailable',
        description: 'AI-powered course creation assistant',
        endpoints: {},
        usage: {},
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Failed to fetch chat info'
      };
    }
  }

  /**
   * Check if the LLM service is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.success && health.ollama_available;
    } catch (error) {
      console.error('Error checking LLM availability:', error);
      return false;
    }
  }
}

export type { 
  ChatMessage, 
  ChatRequest, 
  ChatResponse, 
  HealthResponse, 
  ChatInfoResponse 
}; 