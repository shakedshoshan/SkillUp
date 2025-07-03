import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const envConfig = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  openaiApiKey: process.env.OPENAI_API_KEY,
  // Add more environment variables as needed
}; 