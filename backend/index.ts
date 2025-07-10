import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { envConfig } from './src/config/env.config';
import { dbConfig } from './src/config/db.config';
import { redisConfig } from './src/config/redis.config';
import { cacheService } from './src/services/cache.service';
import userRouter from './src/route/user.route';
import courseRouter from './src/route/course.route';
import lessonRouter from './src/route/lesson.route';
import courseGenerationRouter, { setupCourseGenerationWebSocket } from './src/route/course-generation.route';
import chatRouter from './src/llm/routes/chat.route';
import { globalErrorHandler, notFound } from './src/middleware/error.middleware';
import { requestLogger, performanceMonitor } from './src/middleware/logger.middleware';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Same CORS logic as Express
      if (!origin) return callback(null, true);
      if (origin === envConfig.corsOrigin || origin === envConfig.frontendUrl) {
        return callback(null, true);
      }
      if (envConfig.nodeEnv === 'development' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});

const PORT = envConfig.port;

// Trust proxy in production (for Vercel, Heroku, etc.)
if (envConfig.trustProxy) {
  app.set('trust proxy', 1);
}

// CORS Configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow the configured frontend URL
    if (origin === envConfig.corsOrigin || origin === envConfig.frontendUrl) {
      return callback(null, true);
    }
    
    // Allow localhost in development
    if (envConfig.nodeEnv === 'development' && 
        (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Logging and Performance Middleware
app.use(requestLogger);
app.use(performanceMonitor);

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make Socket.IO instance available to routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SkillUp API is running...',
    environment: envConfig.nodeEnv,
    frontendUrl: envConfig.frontendUrl,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database health check
app.get('/health/db', async (req: Request, res: Response) => {
  try {
    const supabase = dbConfig.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Redis health check
app.get('/health/redis', async (req: Request, res: Response) => {
  try {
    const stats = await cacheService.getStats();
    
    res.json({
      status: stats.connected ? 'healthy' : 'disconnected',
      redis: stats.connected ? 'connected' : 'disconnected',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Full health check (database + redis)
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database
    const supabase = dbConfig.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    const dbHealthy = !error || error.code === 'PGRST116';

    // Check Redis
    const redisStats = await cacheService.getStats();

    res.json({
      status: dbHealthy && redisStats.connected ? 'healthy' : 'degraded',
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisStats.connected ? 'connected' : 'disconnected'
      },
      redis: redisStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// API v1 routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/v1/course-generation', courseGenerationRouter);
app.use('/api/v1/chat', chatRouter);

// API v1 info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'SkillUp API v1',
    frontendUrl: envConfig.frontendUrl,
    availableEndpoints: [
      'GET /api/v1/users - Get all users',
      'GET /api/v1/users/:id - Get user by ID',
      'GET /api/v1/users/:userId/enrolled-courses - Get enrolled courses for user',
      'GET /api/v1/courses - Get all courses',
      'GET /api/v1/courses/published - Get published courses only',
      'GET /api/v1/courses/user/:userId - Get courses by user ID (basic data only)',
      'POST /api/v1/courses/:courseId/enroll - Enroll user in course',
      'GET /api/v1/courses/:courseId/enrollment/:userId - Get course enrollment',
      'PUT /api/v1/courses/:courseId/progress - Update course progress',
      'GET /api/v1/courses/:courseId/completions/:userId - Get all lesson completions for a course',
      'GET /api/v1/courses/:id - Get course by ID with all nested data (parts, lessons, content, quizzes)',
      'POST /api/v1/lessons/:lessonId/complete - Complete a lesson',
      'GET /api/v1/lessons/:lessonId/completion/:userId - Get lesson completion',
      'POST /api/v1/lessons/:lessonId/quiz/submit - Submit quiz for lesson',
      'POST /api/v1/course-generation/generate - Generate a course',
      'GET /api/v1/course-generation/status/:sessionId - Get course generation status',
      'GET /api/v1/course-generation/logs/:sessionId - Get course generation logs',
      'GET /api/v1/course-generation/download/:sessionId - Download generated course',
      'GET /api/v1/course-generation/load/:courseId - Load a saved course',
      'GET /api/v1/course-generation/list - List all saved courses',
      'POST /api/v1/chat - Chat with CourseBot for course idea brainstorming',
      'GET /api/v1/chat/health - Check CourseBot service health',
      'GET /api/v1/chat/models - Get available Ollama models',
    ]
  });
});

// 404 handler for undefined routes
app.use('*', notFound);

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Initialize and start server
async function startServer() {
  try {
    // Initialize database connection
    await dbConfig.connect();
    console.log('✅ Database connection initialized');

    // Initialize Redis connection
    try {
      await redisConfig.connect();
      console.log('✅ Redis connection initialized');
    } catch (redisError) {
      console.warn('⚠️  Redis connection failed, continuing without cache:', redisError);
      // Continue without Redis - the app will work without caching
    }

    // Set up WebSocket handlers
    setupCourseGenerationWebSocket(io);
    console.log('🔌 WebSocket handlers initialized');

    // Set up graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
      
      // Close server first
             server.close(async () => {
         try {
           // Note: Supabase uses HTTP requests, no explicit disconnect needed
           console.log('✅ Database connections closed');
           
           // Close Redis connections
           await redisConfig.gracefulShutdown();
           console.log('✅ Redis connections closed');
           
           console.log('👋 Graceful shutdown completed');
           process.exit(0);
         } catch (error) {
           console.error('❌ Error during graceful shutdown:', error);
           process.exit(1);
         }
       });
    };

    // Handle process termination
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${envConfig.nodeEnv} mode on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${envConfig.frontendUrl}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 Database health: http://localhost:${PORT}/health/db`);
      console.log(`🔴 Redis health: http://localhost:${PORT}/health/redis`);
      console.log(`🔗 API Info: http://localhost:${PORT}/api/v1`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/socket.io/`);
      console.log(`🤖 Course Generation: POST /api/v1/course-generation/generate`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
