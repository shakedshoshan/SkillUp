import { ChatMessage, ConversationContext, CourseIdea } from './openai.service';
import { cacheService } from '../../services/cache.service';

export interface ConversationSession {
  sessionId: string;
  userId?: string;
  messages: ChatMessage[];
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
  lastActivity: Date;
  messageCount: number;
}

export interface SessionSummary {
  sessionId: string;
  userId?: string;
  conversationStage: string;
  identifiedTopics: string[];
  suggestedCoursesCount: number;
  lastActivity: Date;
  messageCount: number;
}

class ConversationMemoryService {
  private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours
  private readonly USER_SESSIONS_TTL = 7 * 24 * 60 * 60; // 7 days

  /**
   * Create or retrieve a conversation session
   */
  async getOrCreateSession(
    sessionId: string, 
    userId?: string, 
    initialContext?: Partial<ConversationContext>
  ): Promise<ConversationSession> {
    const cacheKey = `conversation:session:${sessionId}`;
    
    // Try to get existing session
    const existingSession = await cacheService.get<ConversationSession>(cacheKey, {
      ttl: this.SESSION_TTL,
      keyPrefix: 'skillup:chat:'
    });

    if (existingSession) {
      // Update last activity
      existingSession.lastActivity = new Date();
      existingSession.updatedAt = new Date();
      
      // Save updated session
      await this.saveSession(existingSession);
      return existingSession;
    }

    // Create new session
    const newSession: ConversationSession = {
      sessionId,
      userId,
      messages: [],
      context: {
        conversationStage: 'discovery',
        identifiedTopics: [],
        suggestedCourses: [],
        userProfile: initialContext?.userProfile,
        ...initialContext
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0
    };

    await this.saveSession(newSession);
    return newSession;
  }

  /**
   * Save a conversation session
   */
  private async saveSession(session: ConversationSession): Promise<void> {
    const cacheKey = `conversation:session:${session.sessionId}`;
    
    await cacheService.set(cacheKey, session, {
      ttl: this.SESSION_TTL,
      keyPrefix: 'skillup:chat:'
    });

    // If user is logged in, track their sessions
    if (session.userId) {
      await this.trackUserSession(session.userId, session.sessionId);
    }
  }

  /**
   * Add a message to a conversation session
   */
  async addMessage(
    sessionId: string, 
    message: ChatMessage, 
    context?: ConversationContext
  ): Promise<ConversationSession> {
    const session = await this.getOrCreateSession(sessionId);
    
    // Add message with metadata
    const messageWithMetadata: ChatMessage = {
      ...message,
      id: `${sessionId}-${Date.now()}`,
      timestamp: new Date()
    };

    session.messages.push(messageWithMetadata);
    session.messageCount = session.messages.length;
    session.lastActivity = new Date();
    session.updatedAt = new Date();

    // Update context if provided
    if (context) {
      session.context = {
        ...session.context,
        ...context,
        identifiedTopics: [...new Set([...session.context.identifiedTopics, ...(context.identifiedTopics || [])])],
        suggestedCourses: [...session.context.suggestedCourses, ...(context.suggestedCourses || [])]
      };
    }

    await this.saveSession(session);
    return session;
  }

  /**
   * Get conversation history for a session
   */
  async getSessionHistory(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    const session = await this.getOrCreateSession(sessionId);
    
    if (limit) {
      return session.messages.slice(-limit);
    }
    
    return session.messages;
  }

  /**
   * Get conversation context for a session
   */
  async getSessionContext(sessionId: string): Promise<ConversationContext> {
    const session = await this.getOrCreateSession(sessionId);
    return session.context;
  }

  /**
   * Update conversation context for a session
   */
  async updateSessionContext(
    sessionId: string, 
    context: Partial<ConversationContext>
  ): Promise<ConversationSession> {
    const session = await this.getOrCreateSession(sessionId);
    
    session.context = {
      ...session.context,
      ...context,
      identifiedTopics: [...new Set([...session.context.identifiedTopics, ...(context.identifiedTopics || [])])],
      suggestedCourses: [...session.context.suggestedCourses, ...(context.suggestedCourses || [])]
    };
    
    session.updatedAt = new Date();
    await this.saveSession(session);
    return session;
  }

  /**
   * Add course ideas to session context
   */
  async addCourseIdeas(sessionId: string, courseIdeas: CourseIdea[]): Promise<void> {
    const session = await this.getOrCreateSession(sessionId);
    
    session.context.suggestedCourses = [
      ...session.context.suggestedCourses,
      ...courseIdeas
    ];
    
    session.updatedAt = new Date();
    await this.saveSession(session);
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string): Promise<SessionSummary[]> {
    const cacheKey = `conversation:user:${userId}:sessions`;
    
    const sessionIds = await cacheService.get<string[]>(cacheKey, {
      ttl: this.USER_SESSIONS_TTL,
      keyPrefix: 'skillup:chat:'
    }) || [];

    const sessions: SessionSummary[] = [];
    
    for (const sessionId of sessionIds) {
      try {
        const session = await this.getOrCreateSession(sessionId, userId);
        sessions.push({
          sessionId: session.sessionId,
          userId: session.userId,
          conversationStage: session.context.conversationStage,
          identifiedTopics: session.context.identifiedTopics,
          suggestedCoursesCount: session.context.suggestedCourses.length,
          lastActivity: session.lastActivity,
          messageCount: session.messageCount
        });
      } catch (error) {
        console.warn(`Failed to load session ${sessionId}:`, error);
      }
    }

    // Sort by last activity (most recent first)
    return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  /**
   * Track user session
   */
  private async trackUserSession(userId: string, sessionId: string): Promise<void> {
    const cacheKey = `conversation:user:${userId}:sessions`;
    
    const sessionIds = await cacheService.get<string[]>(cacheKey, {
      ttl: this.USER_SESSIONS_TTL,
      keyPrefix: 'skillup:chat:'
    }) || [];

    // Add session if not already tracked
    if (!sessionIds.includes(sessionId)) {
      sessionIds.push(sessionId);
      
      // Keep only last 10 sessions per user
      if (sessionIds.length > 10) {
        sessionIds.splice(0, sessionIds.length - 10);
      }

      await cacheService.set(cacheKey, sessionIds, {
        ttl: this.USER_SESSIONS_TTL,
        keyPrefix: 'skillup:chat:'
      });
    }
  }

  /**
   * Delete a conversation session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const cacheKey = `conversation:session:${sessionId}`;
    
    await cacheService.clearByPattern(cacheKey, {
      keyPrefix: 'skillup:chat:'
    });
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    // This would typically be handled by Redis TTL
    // But we can add additional cleanup logic here if needed
    console.log('Session cleanup completed');
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<{
    messageCount: number;
    conversationStage: string;
    identifiedTopicsCount: number;
    suggestedCoursesCount: number;
    sessionDuration: number; // in minutes
  }> {
    const session = await this.getOrCreateSession(sessionId);
    
    const sessionDuration = Math.floor(
      (Date.now() - session.createdAt.getTime()) / (1000 * 60)
    );

    return {
      messageCount: session.messageCount,
      conversationStage: session.context.conversationStage,
      identifiedTopicsCount: session.context.identifiedTopics.length,
      suggestedCoursesCount: session.context.suggestedCourses.length,
      sessionDuration
    };
  }

  /**
   * Export session data for backup or analysis
   */
  async exportSession(sessionId: string): Promise<ConversationSession> {
    const session = await this.getOrCreateSession(sessionId);
    return session;
  }

  /**
   * Import session data
   */
  async importSession(session: ConversationSession): Promise<void> {
    await this.saveSession(session);
  }
}

export const conversationMemoryService = new ConversationMemoryService();
 