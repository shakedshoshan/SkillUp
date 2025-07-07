# Course Builder Agent

A Node.js implementation of an intelligent course building agent using LangChain and OpenAI. This agent automatically creates comprehensive, structured courses on any topic with **optional real-time web search capabilities** for current information.

## Features

- **🌐 Web Search Integration**: Uses OpenAI's web search capabilities to gather current information
- **📚 Complete Course Generation**: Creates structured courses with parts and lessons
- **🔄 Real-time Streaming**: WebSocket-based progress updates for web UI
- **💾 Database Integration**: Automatic saving to Supabase database
- **📊 Course Management**: Full CRUD operations for courses
- **🔄 Intelligent Workflow**: 3-step process following LangGraph patterns
- **⚡ Fallback Support**: Graceful fallback to standard models if web search fails

## Web Search Enhancement

The course builder supports two modes:

### 🌐 Web Search Mode
- Uses **OpenAI's Responses API** with `web_search_preview` tool
- Gathers latest trends and developments
- Finds current real-world examples and case studies
- Discovers up-to-date tools and technologies
- Accesses recent statistics and research findings
- Incorporates current industry standards and practices

### 📚 Standard Mode
- Uses standard knowledge base without web access
- Faster processing time
- No additional API costs for web search
- Reliable content based on training data

## Workflow Steps

1. **📋 Extract Course Structure** - Analyzes subject and creates logical course outline
2. **📚 Build Lessons** - Generates detailed lessons for each course part  
3. **📝 Generate Content** - Creates comprehensive lesson content (with or without web search)

## Installation & Setup

```bash
npm install
```

## Usage (Web API)

### Generate Course via API
```typescript
import { StreamingCourseBuilderAgent } from './course_agent';

const agent = new StreamingCourseBuilderAgent((message) => {
  console.log('Progress:', message);
});

const courseId = await agent.generateCourse({
  course_topic: "Machine Learning Fundamentals",
  search_web: true,
  user_id: "user-uuid-here"
});
```

### WebSocket Integration
The agent integrates with Socket.IO for real-time progress updates:

```typescript
// In your route handler
const agent = new StreamingCourseBuilderAgent((message) => {
  io.to(sessionId).emit('course_generation_update', message);
});
```

## Example Output

### With Web Search:
- **🌐 Search the web** for current trends, tools, and practices
- **📋 Generate structure** with latest industry insights
- **📚 Create lessons** incorporating recent developments
- **📝 Generate content** with current examples and cutting-edge techniques

### Without Web Search:
- **📚 Use knowledge base** for foundational concepts
- **📋 Generate structure** with proven methodologies
- **📚 Create lessons** with established best practices
- **📝 Generate content** with reliable examples and exercises

Each lesson includes:
- Learning objectives
- Detailed content (current or foundational)
- Key concepts and terminology
- Practical examples
- Hands-on exercises
- Interactive quiz questions
- Realistic time estimates

## Architecture

- **`workflow.ts`**: Main orchestrator with conditional web search
- **`course-builder-stream.ts`**: Streaming agent for web API integration
- **`models.ts`**: TypeScript data models and Zod schemas
- **`prompts.ts`**: System and user prompts with web search instructions
- **`course-saver.ts`**: Database persistence utilities
- **`course-formatter.ts`**: Display formatting utilities
- **`knowledge-service.ts`**: Subject knowledge gathering

## Technical Details

- **Web Search Model**: OpenAI Responses API with `web_search_preview` tool
- **Standard Model**: `gpt-3.5-turbo` for structure and lesson planning
- **Streaming**: Real-time progress updates via WebSocket
- **Database**: Supabase integration for course persistence
- **Structured Output**: Zod schemas ensure consistent JSON responses
- **Error Handling**: Automatic fallback to standard models if web search fails
- **TypeScript**: Full type safety with comprehensive interfaces

## Integration

This course agent is designed to integrate with the SkillUp web application:

1. **Frontend** calls `/api/course-generation/generate` endpoint
2. **Backend route** creates `StreamingCourseBuilderAgent` instance
3. **Agent** runs workflow and emits progress via WebSocket
4. **Course** is automatically saved to database upon completion
5. **Frontend** receives real-time updates and final course ID 