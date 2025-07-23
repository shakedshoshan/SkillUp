# Environment Setup for Enhanced Chat API

## Required Environment Variables

Add these to your `.env` file in the `backend` directory:

```bash
# OpenAI Configuration (REQUIRED)
OPENAI_API_KEY=your_openai_api_key_here

# Optional OpenAI Configuration
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Redis Configuration (for session management)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password_if_any

# Existing Configuration (keep these)
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in the left sidebar
4. Click "Create new secret key"
5. Copy the generated key and add it to your `.env` file

## Testing the Setup

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Run the test script:
   ```bash
   node test-enhanced-chat.js
   ```

3. Check the health endpoint:
   ```bash
   curl http://localhost:3000/api/v1/chat/enhanced/health
   ```

## Troubleshooting

### "OPENAI_API_KEY environment variable is required"
- Make sure you've added the `OPENAI_API_KEY` to your `.env` file
- Restart the server after adding the environment variable

### "Failed to get response from CourseBot"
- Check that your OpenAI API key is valid
- Ensure you have sufficient credits in your OpenAI account
- Verify your internet connection

### Redis Connection Issues
- The enhanced chat API will work without Redis, but session management will be limited
- Install Redis locally or use a cloud Redis service
- Make sure Redis is running on the configured URL

## Model Options

- `gpt-4o-mini`: Fastest and most cost-effective (recommended for development)
- `gpt-4o`: More powerful but slower and more expensive
- `gpt-3.5-turbo`: Good balance of speed and capability

## Cost Considerations

- `gpt-4o-mini`: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- `gpt-4o`: ~$2.50 per 1M input tokens, ~$10.00 per 1M output tokens
- `gpt-3.5-turbo`: ~$0.50 per 1M input tokens, ~$1.50 per 1M output tokens

For development and testing, `gpt-4o-mini` is recommended as it provides good quality responses at a lower cost. 