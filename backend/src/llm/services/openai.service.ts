import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  timestamp?: Date;
  metadata?: {
    intent?: string;
    entities?: Array<{ type: string; value: string; confidence: number }>;
    sentiment?: 'positive' | 'negative' | 'neutral';
    topics?: string[];
  };
}

export interface CourseIdea {
  title: string;
  description: string;
  targetAudience: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  keyTopics: string[];
  marketPotential: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

export interface ConversationContext {
  userProfile?: {
    skills?: string[];
    experience?: string;
    industry?: string;
    goals?: string[];
  };
  conversationStage: 'discovery' | 'ideation' | 'planning' | 'validation';
  identifiedTopics: string[];
  suggestedCourses: CourseIdea[];
}

class OpenAIService {
  private llm: ChatOpenAI;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.llm = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      openAIApiKey: this.apiKey,
    });
  }

  /**
   * Convert LangChain messages to our ChatMessage format
   */
  private convertToLangChainMessages(messages: ChatMessage[]) {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  /**
   * Send a chat message to OpenAI and get response
   */
  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const langChainMessages = this.convertToLangChainMessages(messages);
      const response = await this.llm.invoke(langChainMessages);
      return response.content as string;
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      throw new Error('Failed to get response from CourseBot');
    }
  }

  /**
   * Create a specialized conversation context for course brainstorming
   */
  createCourseConversation(
    userMessage: string, 
    history: ChatMessage[] = [],
    context?: ConversationContext
  ): ChatMessage[] {
    const systemPrompt = this.buildSystemPrompt(context);
    
    const systemMessage: ChatMessage = {
      role: 'system',
      content: systemPrompt
    };

    return [
      systemMessage,
      ...history.slice(-10), // Keep last 10 messages for context
      {
        role: 'user',
        content: userMessage
      }
    ];
  }

  /**
   * Build a comprehensive system prompt for course brainstorming
   */
  private buildSystemPrompt(context?: ConversationContext): string {
    const basePrompt = `You are CourseBot, an expert AI assistant specializing in helping users brainstorm and develop course creation ideas. Your role is to guide users through the process of identifying their unique value proposition and creating compelling online courses.

CORE RESPONSIBILITIES:
1. Help users identify their skills, expertise, and unique value
2. Suggest specific course ideas based on their background and goals
3. Provide detailed course outlines and learning objectives
4. Guide users through market research and audience identification
5. Offer practical advice on course structure and delivery methods

CONVERSATION APPROACH:
- Ask probing questions to understand the user's expertise and goals
- Provide 2-3 specific course ideas with brief outlines when appropriate
- Always ask follow-up questions to dive deeper
- Be encouraging and supportive while maintaining professionalism
- Focus on actionable, practical advice

COURSE IDEA STRUCTURE:
When suggesting courses, include:
- Clear, compelling title
- Target audience description
- Key learning objectives
- Estimated duration
- Difficulty level (beginner/intermediate/advanced)
- Market potential indicators

RESPONSE STYLE:
- Conversational and engaging
- Professional yet friendly
- Specific and actionable
- Encouraging and motivating
- Focus on the user's unique value proposition`;

    if (context?.userProfile) {
      const profile = context.userProfile;
      return `${basePrompt}

USER CONTEXT:
- Skills: ${profile.skills?.join(', ') || 'Not specified'}
- Experience: ${profile.experience || 'Not specified'}
- Industry: ${profile.industry || 'Not specified'}
- Goals: ${profile.goals?.join(', ') || 'Not specified'}

CONVERSATION STAGE: ${context.conversationStage}
PREVIOUSLY IDENTIFIED TOPICS: ${context.identifiedTopics.join(', ') || 'None'}

Use this context to provide more personalized and relevant suggestions.`;
    }

    return basePrompt;
  }

  /**
   * Generate structured course ideas based on user input
   */
  async generateCourseIdeas(
    userInput: string,
    context?: ConversationContext
  ): Promise<CourseIdea[]> {
    const prompt = `Based on the following user input, generate 3 specific course ideas. For each course idea, provide:

1. A compelling title
2. A clear description of what the course covers
3. Target audience (be specific about who would benefit most)
4. Difficulty level (beginner/intermediate/advanced)
5. Estimated duration (e.g., "4 weeks", "6 hours", "8 modules")
6. Key topics that will be covered (5-7 main topics)
7. Market potential assessment (low/medium/high)
8. Prerequisites (what students should know before taking the course)

User Input: "${userInput}"

${context?.userProfile ? `User Context: ${JSON.stringify(context.userProfile)}` : ''}

Format your response as a JSON array with the following structure:
[
  {
    "title": "Course Title",
    "description": "Course description",
    "targetAudience": "Specific target audience",
    "difficultyLevel": "beginner|intermediate|advanced",
    "estimatedDuration": "Duration estimate",
    "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
    "marketPotential": "low|medium|high",
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"]
  }
]

Respond only with the JSON array, no additional text.`;

    try {
      const response = await this.chat([
        {
          role: 'user',
          content: prompt
        }
      ]);

      // Try to parse the JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as CourseIdea[];
      }

      throw new Error('Failed to parse course ideas from response');
    } catch (error) {
      console.error('Error generating course ideas:', error);
      throw new Error('Failed to generate course ideas');
    }
  }

  /**
   * Analyze user input for intent and extract relevant information
   */
  async analyzeUserInput(userInput: string): Promise<{
    intent: string;
    entities: Array<{ type: string; value: string; confidence: number }>;
    sentiment: 'positive' | 'negative' | 'neutral';
    topics: string[];
  }> {
    const prompt = `Analyze the following user input for course brainstorming:

User Input: "${userInput}"

Provide a JSON response with:
1. intent: The user's primary intention (e.g., "explore_topics", "get_course_ideas", "validate_idea", "learn_more")
2. entities: Array of relevant entities found (skills, industries, tools, etc.)
3. sentiment: Overall sentiment (positive/negative/neutral)
4. topics: Array of relevant topics or themes mentioned

Format as JSON:
{
  "intent": "string",
  "entities": [{"type": "string", "value": "string", "confidence": number}],
  "sentiment": "positive|negative|neutral",
  "topics": ["string"]
}

Respond only with the JSON object.`;

    try {
      const response = await this.chat([
        {
          role: 'user',
          content: prompt
        }
      ]);

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('Failed to parse analysis from response');
    } catch (error) {
      console.error('Error analyzing user input:', error);
      return {
        intent: 'general_inquiry',
        entities: [],
        sentiment: 'neutral',
        topics: []
      };
    }
  }

  /**
   * Check if OpenAI service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Test with a simple prompt
      await this.chat([
        {
          role: 'user',
          content: 'Hello'
        }
      ]);
      return true;
    } catch (error) {
      console.error('OpenAI service not available:', error);
      return false;
    }
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      provider: 'OpenAI',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000,
      features: [
        'Course idea generation',
        'Intent analysis',
        'Conversation context management',
        'Structured course planning'
      ]
    };
  }
}

export const openaiService = new OpenAIService();
 