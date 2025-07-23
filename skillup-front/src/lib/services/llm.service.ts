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
  openai_available: boolean;
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
  usage: Record<string, unknown>;
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
      // Use the enhanced chat endpoint
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message, 
          history,
          generateIdeas: false // Keep it simple for now
        } as ChatRequest)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const enhancedResponse = await response.json();
      
      // Convert enhanced response to simple format
      return {
        success: enhancedResponse.success,
        reply: enhancedResponse.reply,
        error: enhancedResponse.error
      };
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
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat/enhanced/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const enhancedHealth = await response.json();
      
      // Convert enhanced health response to simple format
      return {
        success: enhancedHealth.success,
        status: enhancedHealth.status,
        service: enhancedHealth.service,
        openai_available: enhancedHealth.openai_available || false,
        available_models: enhancedHealth.available_models || [],
        timestamp: enhancedHealth.timestamp,
        error: enhancedHealth.error
      };
    } catch (error) {
      console.error('Error checking LLM health:', error);
      return {
        success: false,
        status: 'error',
        service: 'CourseBot',
        openai_available: false,
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
      const response = await fetch(`${this.API_BASE_URL}/api/v1/chat/enhanced/info`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const enhancedInfo = await response.json();
      
      // Convert enhanced info response to simple format
      return {
        success: enhancedInfo.success,
        service: enhancedInfo.service,
        status: enhancedInfo.status,
        description: enhancedInfo.description,
        endpoints: enhancedInfo.endpoints || {},
        usage: enhancedInfo.usage || {},
        timestamp: enhancedInfo.timestamp,
        error: enhancedInfo.error
      };
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
      return health.success && health.openai_available;
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