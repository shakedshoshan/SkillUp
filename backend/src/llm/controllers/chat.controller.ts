import { Request, Response } from 'express';
import { ollamaService, ChatMessage } from '../services/ollama.service';

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

interface ChatResponse {
  reply: string;
  success: boolean;
  error?: string;
}

class ChatController {
  /**
   * Handle chat message from user
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const { message, history = [] } = req.body as ChatRequest;

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Message is required and must be a string'
        } as ChatResponse);
        return;
      }

      // Check if Ollama service is available
      const isAvailable = await ollamaService.isAvailable();
      if (!isAvailable) {
        res.status(503).json({
          success: false,
          error: 'CourseBot is currently unavailable. Please ensure Ollama is running.'
        } as ChatResponse);
        return;
      }

      // Create conversation with context
      const conversation = ollamaService.createCourseConversation(message, history);

      // Get response from Ollama
      const reply = await ollamaService.chat(conversation);

      res.json({
        success: true,
        reply
      } as ChatResponse);

    } catch (error) {
      console.error('Chat controller error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      } as ChatResponse);
    }
  }

  /**
   * Get health status of the chat service
   */
  async health(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = await ollamaService.isAvailable();
      const models = await ollamaService.getModels();

      res.json({
        success: true,
        status: isAvailable ? 'healthy' : 'unavailable',
        service: 'CourseBot',
        ollama_available: isAvailable,
        available_models: models,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Health check failed'
      });
    }
  }

  /**
   * Get available models
   */
  async getModels(req: Request, res: Response): Promise<void> {
    try {
      const models = await ollamaService.getModels();
      res.json({
        success: true,
        models
      });
    } catch (error) {
      console.error('Get models error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch models'
      });
    }
  }

  /**
   * Get chat API information
   */
  async info(req: Request, res: Response): Promise<void> {
    try {
      const isAvailable = await ollamaService.isAvailable();
      
      res.json({
        success: true,
        service: 'CourseBot Chat API',
        status: isAvailable ? 'available' : 'unavailable',
        description: 'AI-powered course creation assistant',
        endpoints: {
          'POST /api/v1/chat': 'Send a message to CourseBot',
          'GET /api/v1/chat/health': 'Check service health',
          'GET /api/v1/chat/models': 'Get available models'
        },
        usage: {
          'POST /api/v1/chat': {
            body: {
              message: 'string (required)',
              history: 'ChatMessage[] (optional)'
            }
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chat info error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat info'
      });
    }
  }
}

export const chatController = new ChatController(); 