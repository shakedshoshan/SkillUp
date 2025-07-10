// Using Node.js built-in fetch (Node 18+)

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'coursebot';
  }

  /**
   * Send a chat message to Ollama and get response
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          stream: false, // Get complete response at once
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OllamaResponse;
      return data.message.content;
    } catch (error) {
      console.error('Error communicating with Ollama:', error);
      throw new Error('Failed to get response from CourseBot');
    }
  }

  /**
   * Check if Ollama service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama service not available:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }
      
      const data = await response.json() as { models: Array<{ name: string }> };
      return data.models.map(model => model.name);
    } catch (error) {
      console.error('Error fetching models:', error);
      return [];
    }
  }

  /**
   * Create a conversation context for course brainstorming
   */
  createCourseConversation(userMessage: string, history: ChatMessage[] = []): ChatMessage[] {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are CourseBot, a friendly assistant helping users brainstorm course creation ideas.
Ask about their skills, hobbies, job, and past experience.
Suggest 2–3 course topics with brief outlines when appropriate.
Always ask follow-up questions and infer context naturally.
Keep responses conversational and encouraging.`
    };

    return [
      systemMessage,
      ...history,
      {
        role: 'user',
        content: userMessage
      }
    ];
  }
}

export const ollamaService = new OllamaService();
export type { ChatMessage }; 