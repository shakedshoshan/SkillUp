import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const envConfig = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY,
  
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
  }
}; 