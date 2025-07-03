import express, { Request, Response } from 'express';
import cors from 'cors';
import { envConfig } from './src/config/env.config';
import { dbConfig } from './src/config/db.config';
import userRouter from './src/route/user.route';

const app = express();
const PORT = envConfig.port;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'SkillUp API is running...',
    environment: envConfig.nodeEnv,
    timestamp: new Date().toISOString()
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

// API v1 info endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'SkillUp API v1',
    availableEndpoints: [
      'GET /api/v1/users - Get all users',
      'GET /api/v1/users/:id - Get user by ID',
      'POST /api/v1/users - Create new user',
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

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${envConfig.nodeEnv} mode on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health/db`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
