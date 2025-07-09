import { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { CourseGenerationController } from '../controller/course-generation.controller';

const router = Router();

/**
 * Start course generation with real-time streaming
 */
router.post('/generate', CourseGenerationController.generateCourse);

/**
 * Get session status
 */
router.get('/session/:sessionId/status', CourseGenerationController.getSessionStatus);

/**
 * Get all active sessions (for debugging)
 */
router.get('/sessions', CourseGenerationController.getAllSessions);

/**
 * WebSocket connection handler
 */
export const setupCourseGenerationWebSocket = (io: SocketIOServer) => {
  CourseGenerationController.setupWebSocket(io);
};

export default router; 