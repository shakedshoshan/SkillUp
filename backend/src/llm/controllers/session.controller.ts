import { Request, Response } from 'express';
import { conversationMemoryService, ConversationSession, SessionSummary } from '../services/conversation-memory.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { ValidationUtils } from '../../utils/validation.utils';

class SessionController {
  /**
   * Get or create a conversation session
   */
  getOrCreateSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId, userId, initialContext } = req.body;

    if (!sessionId || typeof sessionId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Session ID is required and must be a string'
      });
      return;
    }

    try {
      const session = await conversationMemoryService.getOrCreateSession(
        sessionId, 
        userId, 
        initialContext
      );

      res.json({
        success: true,
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          messageCount: session.messageCount,
          conversationStage: session.context.conversationStage,
          identifiedTopics: session.context.identifiedTopics,
          suggestedCoursesCount: session.context.suggestedCourses.length,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        }
      });
    } catch (error) {
      console.error('Session creation error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session'
      });
    }
  });

  /**
   * Get conversation history for a session
   */
  getSessionHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const { limit } = req.query;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    try {
      const history = await conversationMemoryService.getSessionHistory(
        sessionId, 
        limit ? parseInt(limit as string) : undefined
      );

      res.json({
        success: true,
        sessionId,
        history,
        count: history.length
      });
    } catch (error) {
      console.error('Session history error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session history'
      });
    }
  });

  /**
   * Get session context
   */
  getSessionContext = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    try {
      const context = await conversationMemoryService.getSessionContext(sessionId);

      res.json({
        success: true,
        sessionId,
        context
      });
    } catch (error) {
      console.error('Session context error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session context'
      });
    }
  });

  /**
   * Update session context
   */
  updateSessionContext = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;
    const { context } = req.body;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    if (!context || typeof context !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Context is required and must be an object'
      });
      return;
    }

    try {
      const session = await conversationMemoryService.updateSessionContext(sessionId, context);

      res.json({
        success: true,
        sessionId,
        context: session.context
      });
    } catch (error) {
      console.error('Session context update error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session context'
      });
    }
  });

  /**
   * Get user's active sessions
   */
  getUserSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    ValidationUtils.validateRequiredParam(userId, 'User ID');

    try {
      const sessions = await conversationMemoryService.getUserSessions(userId);

      res.json({
        success: true,
        userId,
        sessions,
        count: sessions.length
      });
    } catch (error) {
      console.error('User sessions error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user sessions'
      });
    }
  });

  /**
   * Delete a conversation session
   */
  deleteSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    try {
      await conversationMemoryService.deleteSession(sessionId);

      res.json({
        success: true,
        message: 'Session deleted successfully',
        sessionId
      });
    } catch (error) {
      console.error('Session deletion error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session'
      });
    }
  });

  /**
   * Get session statistics
   */
  getSessionStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    try {
      const stats = await conversationMemoryService.getSessionStats(sessionId);

      res.json({
        success: true,
        sessionId,
        stats
      });
    } catch (error) {
      console.error('Session stats error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get session statistics'
      });
    }
  });

  /**
   * Export session data
   */
  exportSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { sessionId } = req.params;

    ValidationUtils.validateRequiredParam(sessionId, 'Session ID');

    try {
      const session = await conversationMemoryService.exportSession(sessionId);

      res.json({
        success: true,
        sessionId,
        session
      });
    } catch (error) {
      console.error('Session export error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export session'
      });
    }
  });

  /**
   * Import session data
   */
  importSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { session } = req.body;

    if (!session || typeof session !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Session data is required and must be an object'
      });
      return;
    }

    try {
      await conversationMemoryService.importSession(session as ConversationSession);

      res.json({
        success: true,
        message: 'Session imported successfully',
        sessionId: session.sessionId
      });
    } catch (error) {
      console.error('Session import error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import session'
      });
    }
  });

  /**
   * Clean up expired sessions
   */
  cleanupSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      await conversationMemoryService.cleanupExpiredSessions();

      res.json({
        success: true,
        message: 'Session cleanup completed'
      });
    } catch (error) {
      console.error('Session cleanup error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cleanup sessions'
      });
    }
  });

  /**
   * Get session API information
   */
  info = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      service: 'Conversation Session Management API',
      description: 'Manage conversation sessions and context for course brainstorming',
      endpoints: {
        'POST /api/v1/chat/sessions': 'Create or get a conversation session',
        'GET /api/v1/chat/sessions/:sessionId/history': 'Get session conversation history',
        'GET /api/v1/chat/sessions/:sessionId/context': 'Get session context',
        'PUT /api/v1/chat/sessions/:sessionId/context': 'Update session context',
        'GET /api/v1/chat/sessions/user/:userId': 'Get user\'s active sessions',
        'DELETE /api/v1/chat/sessions/:sessionId': 'Delete a session',
        'GET /api/v1/chat/sessions/:sessionId/stats': 'Get session statistics',
        'GET /api/v1/chat/sessions/:sessionId/export': 'Export session data',
        'POST /api/v1/chat/sessions/import': 'Import session data',
        'POST /api/v1/chat/sessions/cleanup': 'Clean up expired sessions'
      },
      features: [
        'Session persistence with Redis caching',
        'Conversation context management',
        'User session tracking',
        'Session statistics and analytics',
        'Session import/export functionality',
        'Automatic session cleanup'
      ],
      timestamp: new Date().toISOString()
    });
  });
}

export const sessionController = new SessionController(); 