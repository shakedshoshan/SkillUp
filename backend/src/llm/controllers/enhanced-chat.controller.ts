import { Request, Response } from 'express';
import { openaiService, ChatMessage, CourseIdea, ConversationContext } from '../services/openai.service';
import { asyncHandler } from '../../middleware/error.middleware';

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  context?: ConversationContext;
  generateIdeas?: boolean;
}

interface ChatResponse {
  success: boolean;
  reply?: string;
  courseIdeas?: CourseIdea[];
  analysis?: {
    intent: string;
    entities: Array<{ type: string; value: string; confidence: number }>;
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
  };
  context?: ConversationContext;
  error?: string;
}

class EnhancedChatController {
  /**
   * Handle enhanced chat message with course brainstorming features
   */
  chat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { message, history = [], context, generateIdeas = false } = req.body as ChatRequest;

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      } as ChatResponse);
      return;
    }

    // Check if OpenAI service is available
    const isAvailable = await openaiService.isAvailable();
    if (!isAvailable) {
      res.status(503).json({
        success: false,
        error: 'CourseBot is currently unavailable. Please check your OpenAI API key and connection.'
      } as ChatResponse);
      return;
    }

    try {
      // Analyze user input for intent and context
      const analysis = await openaiService.analyzeUserInput(message);

      // Create conversation with context
      const conversation = openaiService.createCourseConversation(message, history, context);

      // Get response from OpenAI
      const reply = await openaiService.chat(conversation);

      // Generate course ideas if requested or if intent suggests it
      let courseIdeas: CourseIdea[] | undefined;
      if (generateIdeas || analysis.intent === 'get_course_ideas' || analysis.intent === 'explore_topics') {
        try {
          courseIdeas = await openaiService.generateCourseIdeas(message, context);
        } catch (error) {
          console.warn('Failed to generate course ideas:', error);
          // Continue without course ideas
        }
      }

      // Update conversation context
      const updatedContext: ConversationContext = {
        ...context,
        conversationStage: this.determineConversationStage(analysis.intent, context?.conversationStage),
        identifiedTopics: [...(context?.identifiedTopics || []), ...analysis.topics],
        suggestedCourses: [...(context?.suggestedCourses || []), ...(courseIdeas || [])]
      };

      res.json({
        success: true,
        reply,
        courseIdeas,
        analysis,
        context: updatedContext
      } as ChatResponse);

    } catch (error) {
      console.error('Enhanced chat controller error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      } as ChatResponse);
    }
  });

  /**
   * Generate course ideas based on user input
   */
  generateCourseIdeas = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userInput, context } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      res.status(400).json({
        success: false,
        error: 'User input is required and must be a string'
      });
      return;
    }

    try {
      const courseIdeas = await openaiService.generateCourseIdeas(userInput, context);

      res.json({
        success: true,
        courseIdeas,
        count: courseIdeas.length
      });
    } catch (error) {
      console.error('Course ideas generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate course ideas'
      });
    }
  });

  /**
   * Analyze user input for intent and context
   */
  analyzeInput = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userInput } = req.body;

    if (!userInput || typeof userInput !== 'string') {
      res.status(400).json({
        success: false,
        error: 'User input is required and must be a string'
      });
      return;
    }

    try {
      const analysis = await openaiService.analyzeUserInput(userInput);

      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Input analysis error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze input'
      });
    }
  });

  /**
   * Get health status of the enhanced chat service
   */
  health = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const isAvailable = await openaiService.isAvailable();
      const serviceInfo = openaiService.getServiceInfo();

      res.json({
        success: true,
        status: isAvailable ? 'healthy' : 'unavailable',
        service: 'Enhanced CourseBot',
        provider: 'OpenAI',
        openai_available: isAvailable,
        service_info: serviceInfo,
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
  });

  /**
   * Get enhanced chat API information
   */
  info = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const isAvailable = await openaiService.isAvailable();
      const serviceInfo = openaiService.getServiceInfo();
      
      res.json({
        success: true,
        service: 'Enhanced CourseBot Chat API',
        status: isAvailable ? 'available' : 'unavailable',
        description: 'AI-powered course creation assistant with advanced brainstorming capabilities',
        provider: 'OpenAI',
        features: [
          'Intelligent course idea generation',
          'Intent analysis and context understanding',
          'Conversation flow management',
          'Structured course planning',
          'Market potential assessment',
          'Personalized recommendations'
        ],
        endpoints: {
          'POST /api/v1/chat/enhanced': 'Enhanced chat with course brainstorming',
          'POST /api/v1/chat/generate-ideas': 'Generate structured course ideas',
          'POST /api/v1/chat/analyze': 'Analyze user input for intent',
          'GET /api/v1/chat/enhanced/health': 'Check service health',
          'GET /api/v1/chat/enhanced/info': 'Get API information'
        },
        usage: {
          'POST /api/v1/chat/enhanced': {
            body: {
              message: 'string (required)',
              history: 'ChatMessage[] (optional)',
              context: 'ConversationContext (optional)',
              generateIdeas: 'boolean (optional)'
            }
          },
          'POST /api/v1/chat/generate-ideas': {
            body: {
              userInput: 'string (required)',
              context: 'ConversationContext (optional)'
            }
          }
        },
        service_info: serviceInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Enhanced chat info error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get chat info'
      });
    }
  });

  /**
   * Get conversation suggestions based on current context
   */
  getSuggestions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { context, lastMessage } = req.body;

    if (!context) {
      res.status(400).json({
        success: false,
        error: 'Context is required'
      });
      return;
    }

    try {
      const prompt = `Based on the current conversation context, suggest 3-5 follow-up questions or prompts that would help the user further develop their course idea.

Context:
- Conversation Stage: ${context.conversationStage}
- Identified Topics: ${context.identifiedTopics.join(', ')}
- User Profile: ${JSON.stringify(context.userProfile)}
- Last Message: "${lastMessage || 'Not provided'}"

Provide suggestions that are:
1. Relevant to the current conversation stage
2. Helpful for course development
3. Engaging and encouraging
4. Specific to the user's context

Format as JSON array:
["Suggestion 1", "Suggestion 2", "Suggestion 3"]

Respond only with the JSON array.`;

      const response = await openaiService.chat([
        {
          role: 'user',
          content: prompt
        }
      ]);

      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const suggestions = JSON.parse(jsonMatch[0]) as string[];
        res.json({
          success: true,
          suggestions
        });
      } else {
        throw new Error('Failed to parse suggestions from response');
      }
    } catch (error) {
      console.error('Suggestions generation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions'
      });
    }
  });

  /**
   * Determine conversation stage based on intent and current stage
   */
  private determineConversationStage(
    intent: string, 
    currentStage?: string
  ): 'discovery' | 'ideation' | 'planning' | 'validation' {
    if (intent === 'explore_topics' || intent === 'get_course_ideas') {
      return 'ideation';
    } else if (intent === 'validate_idea' || intent === 'learn_more') {
      return 'validation';
    } else if (currentStage === 'discovery') {
      return 'discovery';
    } else if (currentStage === 'ideation') {
      return 'ideation';
    } else if (currentStage === 'planning') {
      return 'planning';
    } else if (currentStage === 'validation') {
      return 'validation';
    }
    
    return 'discovery';
  }
}

export const enhancedChatController = new EnhancedChatController(); 