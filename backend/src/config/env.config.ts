import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const envConfig = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  
  // Frontend Configuration
  frontendUrl: process.env.FRONTEND_URL || 'https://skill-up-lake.vercel.app',
  corsOrigin: process.env.CORS_ORIGIN || 'https://skill-up-lake.vercel.app',
  trustProxy: process.env.TRUST_PROXY === 'true',
  
  // Supabase Configuration
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    // Connection pooling configuration
    pooled: process.env.DATABASE_POOLED_URL || process.env.DATABASE_URL,
  },

  // Redis Cloud Configuration
  redis: {
    url: process.env.REDIS_URL, // Redis Cloud provides this
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'skillup:',
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'), // 1 hour default
    courseTTL: parseInt(process.env.REDIS_COURSE_TTL || '3600'), // Course-specific TTL
  }
}; 