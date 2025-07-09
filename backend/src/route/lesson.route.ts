import { Router, Request, Response } from 'express';
import { StreamingCourseBuilderAgent, StreamMessage } from '../course_agent/course-builder-stream';
import { CourseActivation } from '../course_agent/models';
import { Server as SocketIOServer } from 'socket.io';

const router = Router();

// Store active generation sessions
const activeSessions = new Map<string, { agent: StreamingCourseBuilderAgent; status: 'running' | 'completed' | 'failed' }>();

/**
 * Start course generation with real-time streaming
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const activation = StreamingCourseBuilderAgent.validateActivationData(req.body);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get Socket.IO instance from app
    const io: SocketIOServer = (req as any).io;
    if (!io) {
      return res.status(500).json({ 
        success: false, 
        error: 'WebSocket server not available' 
      });
    }

    // Create streaming agent with WebSocket emit callback
    const agent = new StreamingCourseBuilderAgent((message: StreamMessage) => {
      io.to(sessionId).emit('course_generation_update', message);
    });

    // Store session
    activeSessions.set(sessionId, { agent, status: 'running' });

    // Send immediate response with session ID
    res.json({
      success: true,
      sessionId,
      message: 'Course generation started. Connect to WebSocket for real-time updates.'
    });

    // Start course generation asynchronously
    try {
      const courseId = await agent.generateCourse(activation);
      
      if (courseId) {
        activeSessions.set(sessionId, { agent, status: 'completed' });
        io.to(sessionId).emit('course_generation_complete', {
          success: true,
          courseId,
          sessionId
        });
      } else {
        activeSessions.set(sessionId, { agent, status: 'failed' });
        io.to(sessionId).emit('course_generation_complete', {
          success: false,
          error: 'Course generation failed',
          sessionId
        });
      }
    } catch (error) {
      activeSessions.set(sessionId, { agent, status: 'failed' });
      io.to(sessionId).emit('course_generation_complete', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId
      });
    }

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid request'
    });
  }
});

/**
 * Get session status
 */
router.get('/session/:sessionId/status', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    sessionId,
    status: session.status
  });
});

/**
 * Get all active sessions (for debugging)
 */
router.get('/sessions', (req: Request, res: Response) => {
  const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
    sessionId: id,
    status: session.status
  }));

  res.json({
    success: true,
    sessions
  });
});

/**
 * WebSocket connection handler
 */
export const setupCourseGenerationWebSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join session room
    socket.on('join_session', (sessionId: string) => {
      socket.join(sessionId);
      console.log(`📡 Client ${socket.id} joined session: ${sessionId}`);
      
      // Send session status if it exists
      const session = activeSessions.get(sessionId);
      if (session) {
        socket.emit('session_status', {
          sessionId,
          status: session.status
        });
      }
    });

    // Leave session room
    socket.on('leave_session', (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`📡 Client ${socket.id} left session: ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Cleanup old sessions periodically (optional)
  setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions.entries()) {
      // Remove sessions older than 1 hour
      const sessionTime = parseInt(sessionId.split('_')[1]);
      if (now - sessionTime > 3600000) { // 1 hour
        activeSessions.delete(sessionId);
        console.log(`🧹 Cleaned up old session: ${sessionId}`);
      }
    }
  }, 300000); // Check every 5 minutes
};

export default router; 