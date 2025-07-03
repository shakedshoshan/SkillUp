# Course Builder Agent

A Node.js implementation of an intelligent course building agent using LangChain and OpenAI. This agent automatically creates comprehensive, structured courses on any topic with **optional real-time web search capabilities** for current information.

## Features

- **🤔 User Choice**: Ask users whether to use web search or standard knowledge
- **🌐 Web Search Integration**: Uses OpenAI's web search capabilities to gather current information
- **📚 Complete Course Generation**: Creates structured courses with parts and lessons
- **🎯 Interactive CLI**: Easy-to-use command-line interface
- **💾 Automatic Saving**: Saves courses to JSON files with timestamps
- **📊 Course Management**: List and view previously created courses
- **🔄 Intelligent Workflow**: 3-step process following LangGraph patterns
- **⚡ Fallback Support**: Graceful fallback to standard models if web search fails

## Web Search Enhancement

When creating a course, users can choose between two modes:

### 🌐 Web Search Mode (Optional)
- Uses **OpenAI's Responses API** with `web_search_preview` tool
- Gathers latest trends and developments
- Finds current real-world examples and case studies
- Discovers up-to-date tools and technologies
- Accesses recent statistics and research findings
- Incorporates current industry standards and practices

### 📚 Standard Mode (Default)
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

## Usage

### Interactive Mode
```bash
npm run course-agent
```

### Available Commands
- **Create new course**: Enter any subject (e.g., "Python for Data Science")
  - **Web Search Choice**: Choose whether to use web search for current information
  - **📍 Yes**: Get latest trends, examples, and current best practices
  - **📚 No**: Use standard knowledge base (faster, no web access)
- **`list`**: Show all saved courses
- **`load [filename]`**: View a specific saved course
- **`help`**: Show available commands
- **`exit`**: Quit the application

### Test Mode
```bash
npm run test-agent
```

## Example Usage Flow

1. **Start the agent**: `npm run course-agent`
2. **Enter topic**: "Machine Learning Fundamentals"
3. **Choose search mode**: 
   - `y` for web search (current ML trends, latest tools)
   - `n` for standard knowledge (faster, reliable basics)
4. **Get results**: 3-5 main parts with 3-5 lessons each
5. **Auto-save**: Course saved to `created_courses/` directory

## Example Output

### With Web Search:
- **🌐 Search the web** for current ML trends, tools, and practices
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
- Realistic time estimates

## Architecture

- **`workflow.ts`**: Main orchestrator with conditional web search
- **`course-builder-agent.ts`**: Interactive CLI with search preference
- **`models.ts`**: TypeScript data models and Zod schemas
- **`prompts.ts`**: System and user prompts with web search instructions
- **`course-saver.ts`**: Course persistence utilities
- **`course-formatter.ts`**: Display formatting utilities
- **`knowledge-service.ts`**: Subject knowledge gathering

## Technical Details

- **Web Search Model**: OpenAI Responses API with `web_search_preview` tool
- **Standard Model**: `gpt-3.5-turbo` for structure and lesson planning
- **User Choice**: Interactive prompt for search preference
- **Structured Output**: Zod schemas ensure consistent JSON responses
- **Error Handling**: Automatic fallback to standard models if web search fails
- **TypeScript**: Full type safety with comprehensive interfaces 