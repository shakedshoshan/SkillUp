import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';

const router = Router();

/**
 * GET /api/v1/chat/sessions/info
 * Get session management API information
 */
router.get('/info', sessionController.info);

/**
 * POST /api/v1/chat/sessions
 * Create or get a conversation session
 * 
 * Body:
 * {
 *   "sessionId": "unique-session-id",
 *   "userId": "optional-user-id",
 *   "initialContext": {
 *     "userProfile": {
 *       "skills": ["marketing", "social media"],
 *       "experience": "5 years",
 *       "industry": "technology"
 *     }
 *   }
 * }
 */
router.post('/', sessionController.getOrCreateSession);

/**
 * GET /api/v1/chat/sessions/:sessionId/history
 * Get conversation history for a session
 * 
 * Query params:
 * - limit: number (optional) - limit number of messages returned
 */
router.get('/:sessionId/history', sessionController.getSessionHistory);

/**
 * GET /api/v1/chat/sessions/:sessionId/context
 * Get session context
 */
router.get('/:sessionId/context', sessionController.getSessionContext);

/**
 * PUT /api/v1/chat/sessions/:sessionId/context
 * Update session context
 * 
 * Body:
 * {
 *   "context": {
 *     "conversationStage": "ideation",
 *     "identifiedTopics": ["digital marketing", "social media"],
 *     "userProfile": {
 *       "skills": ["marketing", "social media", "content creation"]
 *     }
 *   }
 * }
 */
router.put('/:sessionId/context', sessionController.updateSessionContext);

/**
 * GET /api/v1/chat/sessions/user/:userId
 * Get user's active sessions
 */
router.get('/user/:userId', sessionController.getUserSessions);

/**
 * DELETE /api/v1/chat/sessions/:sessionId
 * Delete a conversation session
 */
router.delete('/:sessionId', sessionController.deleteSession);

/**
 * GET /api/v1/chat/sessions/:sessionId/stats
 * Get session statistics
 */
router.get('/:sessionId/stats', sessionController.getSessionStats);

/**
 * GET /api/v1/chat/sessions/:sessionId/export
 * Export session data
 */
router.get('/:sessionId/export', sessionController.exportSession);

/**
 * POST /api/v1/chat/sessions/import
 * Import session data
 * 
 * Body:
 * {
 *   "session": {
 *     "sessionId": "session-id",
 *     "userId": "user-id",
 *     "messages": [...],
 *     "context": {...},
 *     "createdAt": "2024-01-15T10:30:00.000Z",
 *     "updatedAt": "2024-01-15T10:30:00.000Z",
 *     "lastActivity": "2024-01-15T10:30:00.000Z",
 *     "messageCount": 10
 *   }
 * }
 */
router.post('/import', sessionController.importSession);

/**
 * POST /api/v1/chat/sessions/cleanup
 * Clean up expired sessions
 */
router.post('/cleanup', sessionController.cleanupSessions);

export default router; 