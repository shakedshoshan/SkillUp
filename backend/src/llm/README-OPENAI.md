# SkillUp Enhanced LLM Chat API - OpenAI Integration

A professional, AI-powered course creation assistant built with OpenAI's GPT models and LangChain, designed to help users brainstorm and develop compelling online course ideas.

## 🚀 Features

### Core Capabilities
- **🤖 Intelligent Course Brainstorming**: AI-powered course idea generation with structured outputs
- **💬 Context-Aware Conversations**: Maintains conversation history and user context across sessions
- **🎯 Intent Analysis**: Automatically detects user intentions and conversation stages
- **📊 Structured Course Planning**: Generates detailed course outlines with market potential assessment
- **🔄 Session Management**: Persistent conversation sessions with Redis caching
- **📈 Conversation Analytics**: Track conversation flow and user engagement

### Advanced Features
- **🧠 Conversation Memory**: Maintains context across multiple chat sessions
- **🎨 Personalized Recommendations**: Adapts responses based on user profile and history
- **📋 Course Idea Templates**: Structured course suggestions with detailed specifications
- **🔍 Market Analysis**: Assesses course potential and target audience
- **📱 Multi-Session Support**: Users can have multiple active brainstorming sessions
- **📊 Session Analytics**: Detailed statistics and insights for each conversation

## 🏗️ Architecture

### System Components
```
Frontend → Enhanced Chat API → OpenAI Service → LangChain → OpenAI GPT Models
                ↓
        Session Management → Redis Cache
                ↓
        Conversation Memory → Context Management
```

### Service Layers
1. **Enhanced Chat Controller**: Handles HTTP requests and response formatting
2. **OpenAI Service**: Core LLM integration with LangChain
3. **Conversation Memory Service**: Session persistence and context management
4. **Session Controller**: Session lifecycle management

## 🛠️ Setup Instructions

### 1. Environment Configuration

Add these environment variables to your `.env` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini  # or gpt-4o, gpt-3.5-turbo

# Redis Configuration (for session management)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# Optional: Customize model parameters
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000
```

### 2. Install Dependencies

The required dependencies are already included in `package.json`:
- `@langchain/openai`: OpenAI integration
- `@langchain/core`: Core LangChain functionality
- `redis`: Session caching
- `express`: Web framework

### 3. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

## 📡 API Endpoints

### Enhanced Chat API

#### POST `/api/v1/chat/enhanced`
Main chat endpoint with course brainstorming features.

**Request Body:**
```json
{
  "message": "I want to create a course about digital marketing",
  "sessionId": "unique-session-id",
  "userId": "optional-user-id",
  "context": {
    "userProfile": {
      "skills": ["marketing", "social media"],
      "experience": "5 years in digital marketing",
      "industry": "technology",
      "goals": ["help beginners", "share expertise"]
    }
  },
  "generateIdeas": true
}
```

**Response:**
```json
{
  "success": true,
  "reply": "That's exciting! Digital marketing is a fantastic topic for an online course...",
  "courseIdeas": [
    {
      "title": "Digital Marketing Fundamentals for Beginners",
      "description": "A comprehensive introduction to digital marketing...",
      "targetAudience": "Marketing beginners and small business owners",
      "difficultyLevel": "beginner",
      "estimatedDuration": "6 weeks",
      "keyTopics": ["SEO", "Social Media Marketing", "Email Marketing"],
      "marketPotential": "high",
      "prerequisites": ["Basic computer skills", "Interest in marketing"]
    }
  ],
  "analysis": {
    "intent": "get_course_ideas",
    "entities": [
      {"type": "topic", "value": "digital marketing", "confidence": 0.95}
    ],
    "sentiment": "positive",
    "topics": ["digital marketing", "online education"]
  },
  "context": {
    "conversationStage": "ideation",
    "identifiedTopics": ["digital marketing"],
    "suggestedCourses": [...]
  }
}
```

#### POST `/api/v1/chat/enhanced/generate-ideas`
Generate structured course ideas.

**Request Body:**
```json
{
  "userInput": "I'm a graphic designer with 8 years of experience",
  "context": {
    "userProfile": {
      "skills": ["graphic design", "Adobe Creative Suite"],
      "experience": "8 years",
      "industry": "creative"
    }
  }
}
```

#### POST `/api/v1/chat/enhanced/analyze`
Analyze user input for intent and context.

**Request Body:**
```json
{
  "userInput": "I want to teach people how to use Photoshop"
}
```

#### POST `/api/v1/chat/enhanced/suggestions`
Get conversation suggestions based on current context.

**Request Body:**
```json
{
  "context": {
    "conversationStage": "ideation",
    "identifiedTopics": ["graphic design", "Photoshop"],
    "userProfile": {
      "skills": ["graphic design"]
    }
  },
  "lastMessage": "I want to create a Photoshop course"
}
```

### Session Management API

#### POST `/api/v1/chat/sessions`
Create or retrieve a conversation session.

#### GET `/api/v1/chat/sessions/:sessionId/history`
Get conversation history for a session.

#### GET `/api/v1/chat/sessions/:sessionId/context`
Get session context.

#### PUT `/api/v1/chat/sessions/:sessionId/context`
Update session context.

#### GET `/api/v1/chat/sessions/user/:userId`
Get user's active sessions.

#### GET `/api/v1/chat/sessions/:sessionId/stats`
Get session statistics.

## 💡 Usage Examples

### Basic Course Brainstorming

```javascript
// Initialize a chat session
const sessionResponse = await fetch('/api/v1/chat/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'user-123-session-1',
    userId: 'user-123',
    initialContext: {
      userProfile: {
        skills: ['programming', 'web development'],
        experience: '3 years',
        industry: 'technology'
      }
    }
  })
});

// Send a message and get course ideas
const chatResponse = await fetch('/api/v1/chat/enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'I want to create a course about web development',
    sessionId: 'user-123-session-1',
    generateIdeas: true
  })
});

const result = await chatResponse.json();
console.log('Course Ideas:', result.courseIdeas);
```

### Advanced Session Management

```javascript
// Get conversation history
const historyResponse = await fetch('/api/v1/chat/sessions/user-123-session-1/history?limit=10');
const history = await historyResponse.json();

// Get session statistics
const statsResponse = await fetch('/api/v1/chat/sessions/user-123-session-1/stats');
const stats = await statsResponse.json();

// Export session data
const exportResponse = await fetch('/api/v1/chat/sessions/user-123-session-1/export');
const sessionData = await exportResponse.json();
```

## 🔧 Configuration Options

### Model Configuration

You can customize the OpenAI model behavior by modifying the service configuration:

```typescript
// In openai.service.ts
this.llm = new ChatOpenAI({
  modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
  openAIApiKey: this.apiKey,
});
```

### Session Configuration

Customize session behavior in `conversation-memory.service.ts`:

```typescript
private readonly SESSION_TTL = 24 * 60 * 60; // 24 hours
private readonly USER_SESSIONS_TTL = 7 * 24 * 60 * 60; // 7 days
```

## 📊 Monitoring & Analytics

### Health Checks

```bash
# Check service health
curl http://localhost:3000/api/v1/chat/enhanced/health

# Get API information
curl http://localhost:3000/api/v1/chat/enhanced/info
```

### Session Analytics

The system provides detailed analytics for each conversation session:

- Message count and conversation duration
- Conversation stage progression
- Identified topics and course suggestions
- User engagement metrics

## 🔒 Security Considerations

1. **API Key Management**: Store OpenAI API keys securely in environment variables
2. **Rate Limiting**: Implement rate limiting for production deployments
3. **Input Validation**: All user inputs are validated and sanitized
4. **Session Security**: Session IDs should be generated securely
5. **Data Privacy**: Consider GDPR compliance for user data storage

## 🚀 Production Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
OPENAI_API_KEY=your_production_openai_key
REDIS_URL=your_production_redis_url
OPENAI_MODEL=gpt-4o  # Use more powerful model for production
```

### Performance Optimization

1. **Caching Strategy**: Leverage Redis for session caching
2. **Connection Pooling**: Optimize database connections
3. **Load Balancing**: Use multiple instances for high traffic
4. **Monitoring**: Implement comprehensive logging and monitoring

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple API instances
- **Database Scaling**: Consider Redis clustering for high availability
- **CDN**: Use CDN for static assets
- **Auto-scaling**: Implement auto-scaling based on traffic patterns

## 🧪 Testing

### Unit Tests

```bash
# Run tests (when implemented)
npm test
```

### API Testing

```bash
# Test chat endpoint
curl -X POST http://localhost:3000/api/v1/chat/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to create a course about cooking",
    "sessionId": "test-session-1"
  }'
```

## 🔄 Migration from Ollama

If migrating from the existing Ollama-based system:

1. **Update Environment Variables**: Replace Ollama config with OpenAI config
2. **Update Frontend**: Modify API endpoints to use enhanced chat endpoints
3. **Data Migration**: Export existing conversation data if needed
4. **Testing**: Thoroughly test all functionality before deployment

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Express.js Documentation](https://expressjs.com/)

## 🤝 Contributing

1. Follow the existing code patterns and architecture
2. Add comprehensive error handling
3. Include TypeScript types for all new features
4. Update documentation for new endpoints
5. Add tests for new functionality

## 📄 License

This project is part of the SkillUp platform. See the main project license for details. 