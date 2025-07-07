import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { envConfig } from './src/config/env.config';
import { dbConfig } from './src/config/db.config';
import userRouter from './src/route/user.route';
import courseRouter from './src/route/course.route';
import courseGenerationRouter, { setupCourseGenerationWebSocket } from './src/route/course-generation.route';

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

// API v1 routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/course-generation', courseGenerationRouter);

// API v1 info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'SkillUp API v1',
    frontendUrl: envConfig.frontendUrl,
    availableEndpoints: [
      'GET /api/v1/users - Get all users',
      'GET /api/v1/users/:id - Get user by ID',
      'POST /api/v1/users - Create new user',
      'GET /api/v1/courses - Get all courses',
      'GET /api/v1/courses/published - Get published courses only',
      'GET /api/v1/courses/user/:userId - Get courses by user ID (basic data only)',
      'GET /api/v1/courses/:id - Get course by ID with all nested data (parts, lessons, content, quizzes)',
      'POST /api/v1/course-generation/generate - Generate a course',
      'GET /api/v1/course-generation/status/:sessionId - Get course generation status',
      'GET /api/v1/course-generation/logs/:sessionId - Get course generation logs',
      'GET /api/v1/course-generation/download/:sessionId - Download generated course',
      'GET /api/v1/course-generation/load/:courseId - Load a saved course',
      'GET /api/v1/course-generation/list - List all saved courses',
    ]
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: envConfig.nodeEnv === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database connection
    await dbConfig.connect();
    console.log('✅ Database connection initialized');

    // Set up WebSocket handlers
    setupCourseGenerationWebSocket(io);
    console.log('🔌 WebSocket handlers initialized');

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running in ${envConfig.nodeEnv} mode on port ${PORT}`);
      console.log(`🌐 Frontend URL: ${envConfig.frontendUrl}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health/db`);
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
