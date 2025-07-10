# CourseBot - LLM Chatbot for Course Idea Brainstorming

CourseBot is an AI-powered chatbot integrated into the SkillUp backend that helps users brainstorm and develop course creation ideas using Ollama with the Gemma 3n model.

## Features

- 🤖 **AI-Powered Conversations**: Uses Gemma 3n model via Ollama for intelligent course brainstorming
- 💬 **Context-Aware Chat**: Maintains conversation history for natural dialogue flow
- 🎯 **Course-Focused**: Specifically designed to help users identify and develop course ideas
- 🔍 **Health Monitoring**: Built-in health checks and service status monitoring
- 🚀 **RESTful API**: Easy integration with frontend applications

## Setup Instructions

### 1. Install Ollama

**On macOS/Linux/WSL:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**On Windows:**
Download from [ollama.com](https://ollama.com)

Verify installation:
```bash
ollama --version
```

### 2. Pull Gemma 3n Model

```bash
ollama pull gemma3n:e4b
```

### 3. Create Custom CourseBot Model

From the backend directory, run:
```bash
ollama create coursebot -f Modelfile
```

This creates a custom model called `coursebot` with the system instructions defined in the `Modelfile`.

### 4. Start Ollama Service

```bash
ollama serve
```

The service will run on `http://localhost:11434` by default.

### 5. Install Dependencies

From the backend directory:
```bash
npm install
```

### 6. Environment Configuration (Optional)

Add these environment variables to your `.env` file if you want to customize the setup:

```bash
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=coursebot
```

### 7. Start the Backend Server

```bash
npm run dev
```

## API Endpoints

### POST /api/v1/chat
Send a message to CourseBot and get a response.

**Request Body:**
```json
{
  "message": "Hi, I want to create an online course about cooking",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant", 
      "content": "Previous response"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "reply": "That's exciting! Cooking courses are always popular. What's your cooking background? Are you more interested in a specific cuisine, basic cooking skills, or maybe something like baking or meal prep?"
}
```

### GET /api/v1/chat/health
Check the health status of CourseBot service.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "CourseBot",
  "ollama_available": true,
  "available_models": ["coursebot", "gemma3n:e4b"],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET /api/v1/chat/models
Get list of available Ollama models.

**Response:**
```json
{
  "success": true,
  "models": ["coursebot", "gemma3n:e4b", "llama2", "codellama"]
}
```

## Usage Examples

### Basic Chat
```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to create a course but not sure what topic to choose"
  }'
```

### Chat with History
```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I work in marketing and love photography",
    "history": [
      {
        "role": "user",
        "content": "I want to create a course but not sure what topic to choose"
      },
      {
        "role": "assistant",
        "content": "I'\''d love to help you brainstorm! Tell me about your skills, hobbies, or professional experience."
      }
    ]
  }'
```

### Health Check
```bash
curl http://localhost:3000/api/v1/chat/health
```

## Frontend Integration Example

```javascript
// React hook for chat functionality
import { useState } from 'react';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (message) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: messages
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newMessages = [
          ...messages,
          { role: 'user', content: message },
          { role: 'assistant', content: data.reply }
        ];
        setMessages(newMessages);
        return data.reply;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
```

## Conversation Flow Example

**User:** "I enjoy drawing and have worked in retail."

**CourseBot:** "Great combination! With your drawing skills and retail experience, you could create some really valuable courses. Are you more interested in teaching digital illustration techniques, or maybe something like 'Visual Marketing for Retail' that combines both skills? I'd love to hear more about what type of drawing you enjoy most!"

**User:** "I mostly do digital illustrations in Procreate."

**CourseBot:** "Perfect! Procreate courses are incredibly popular. Here are 2-3 course ideas for you:

1. **'Procreate for Beginners'** - Cover basic tools, brush techniques, and creating your first illustrations
2. **'Retail-Inspired Digital Art'** - Teach creating product mockups, store signage, and marketing visuals
3. **'From Sketch to Sale'** - Show how to create digital art that can be sold online or used in business

Which direction interests you most? And do you have any specific Procreate techniques you're particularly good at?"

## Troubleshooting

### CourseBot Not Available
If you get a "CourseBot is currently unavailable" error:

1. **Check Ollama Service:**
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Restart Ollama:**
   ```bash
   ollama serve
   ```

3. **Verify Model Exists:**
   ```bash
   ollama list
   ```
   You should see `coursebot` in the list.

4. **Recreate Model if Missing:**
   ```bash
   ollama create coursebot -f Modelfile
   ```

### Performance Issues
- **Reduce Context Window**: Lower `num_ctx` in the Modelfile (default: 32768)
- **Adjust Temperature**: Modify `temperature` parameter for different response styles
- **Use Smaller Model**: Try `gemma2:2b` instead of `gemma3n:e4b` for faster responses

### Memory Usage
The Gemma 3n e4b model requires approximately 4GB of RAM. For systems with limited memory:
- Use `gemma2:2b` (requires ~2GB)
- Close other applications while running
- Consider using Ollama's quantized models

## Development

### Project Structure
```
backend/src/llm/
├── services/
│   └── ollama.service.ts     # Ollama API integration
├── controllers/
│   └── chat.controller.ts    # HTTP request handlers
├── routes/
│   └── chat.route.ts         # Express routes
└── README.md                 # This file
```

### Adding New Features

1. **Custom System Prompts**: Modify the `Modelfile` and recreate the model
2. **New Endpoints**: Add routes in `chat.route.ts` and handlers in `chat.controller.ts`
3. **Different Models**: Update `OLLAMA_MODEL` environment variable
4. **Streaming Responses**: Modify the service to handle streaming API responses

## Security Notes

- The chat service runs locally and doesn't send data to external services
- Consider rate limiting for production deployments
- Validate and sanitize all user inputs
- Monitor resource usage to prevent abuse

## Contributing

1. Follow the existing code patterns
2. Add proper error handling
3. Include TypeScript types
4. Update this README for new features
5. Test with different conversation scenarios 