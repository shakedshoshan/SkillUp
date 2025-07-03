# Course Builder Agent

A Node.js/TypeScript course builder agent that creates comprehensive courses based on user input.

## Features

- Extract Course Structure: Identifies main course parts (max 5)
- Build Lessons: Generates lessons for each part (max 5 per part)
- Generate Content: Creates detailed content for each lesson
- Auto-Save: Automatically saves generated courses to JSON files
- Course Management: List, load, and view saved courses
- Interactive Console: User-friendly command-line interface

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create a .env file in the backend directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Agent
```bash
npm run course-agent
```

## Usage

1. Start the agent with `npm run course-agent`
2. Available commands:
   - Enter a course subject to build a new course (e.g., "Python for Data Science")
   - Type `list` to see all saved courses
   - Type `load [filename]` to view a saved course
   - Type `quit` to exit
3. Generated courses are automatically saved to `created_courses/` folder
4. Explore detailed lesson content by entering `part.lesson` (e.g., `1.2`)

### Course Files
- All courses are saved as JSON files with timestamps
- Location: `backend/created_courses/`
- Format: `course-title_YYYY-MM-DDTHH-MM-SS.json`
- Contains metadata and complete course structure

## Architecture

- models.ts: TypeScript data models using Zod
- workflow.ts: Main workflow orchestrator
- prompts.ts: All system and user prompts
- knowledge-service.ts: Knowledge gathering service
- course-formatter.ts: Output formatting utilities
- course-saver.ts: Course saving and loading utilities
- course-builder-agent.ts: Main console interface 