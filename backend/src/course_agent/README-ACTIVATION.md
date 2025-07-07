# Course Builder Agent - Web API Activation Guide

## ✅ FIXED: Duplicate Course Saving Issue

**Problem**: Two courses were being saved for every generation call
**Root Cause**: Double saving in workflow and streaming agent
**Solution**: Removed duplicate save from workflow, kept only in streaming agent

## 🧹 Cleaned Up Architecture

### **✅ CORE FILES (Web API)**
- `workflow.ts` - Main course building logic (cleaned up)
- `course-builder-stream.ts` - Streaming agent for web API
- `course-saver.ts` - Database operations
- `course-formatter.ts` - Output formatting
- `knowledge-service.ts` - Knowledge gathering
- `prompts.ts` - AI prompts
- `models.ts` - Data types and schemas

### **❌ REMOVED FILES (CLI/Testing)**
- `course-builder-agent.ts` - CLI interactive agent
- `course-builder-json.ts` - JSON file processing
- `json-runner.ts` - CLI runner
- `test-agent.ts` - Test file
- `COURSE_BUILDER_AGENT_PLAN.md` - Outdated Python plan

### **🧹 CLEANED UP**
- Removed CLI npm scripts from `package.json`
- Removed `readline-sync` dependency (CLI only)
- Updated `index.ts` exports (web API only)
- Updated `README.md` (web API focused)

## 🔄 Current Flow (Web API)

```
Frontend Request
↓
/api/course-generation/generate
↓
StreamingCourseBuilderAgent
↓
CourseBuilderWorkflow
├── Extract Course Structure
├── Build Lessons  
└── Generate Content (web search optional)
↓
StreamingCourseBuilderAgent.saveCourse()
↓
Database Save (SINGLE SAVE!)
↓
WebSocket Updates to Frontend
```

## 🚀 Web API Usage

### Generate Course
```typescript
import { StreamingCourseBuilderAgent } from '../course_agent';

const agent = new StreamingCourseBuilderAgent((message) => {
  // Real-time progress updates
  io.to(sessionId).emit('course_generation_update', message);
});

const courseId = await agent.generateCourse({
  course_topic: "Machine Learning Fundamentals",
  search_web: true,
  user_id: "user-uuid-here"
});
```

### WebSocket Integration
```typescript
// Frontend connects to session
socket.emit('join_session', sessionId);

// Receive real-time updates
socket.on('course_generation_update', (message) => {
  console.log('Progress:', message);
});

// Receive completion
socket.on('course_generation_complete', (result) => {
  console.log('Course ID:', result.courseId);
});
```

## 🎯 Key Improvements

1. **✅ Fixed Duplicate Saving**: Only one save per course generation
2. **🧹 Streamlined Architecture**: Removed unnecessary CLI files
3. **🔄 Clean Web Flow**: Single responsibility for each component
4. **📡 Real-time Updates**: WebSocket integration for progress
5. **💾 Database Integration**: Automatic saving to Supabase
6. **🌐 Web Search**: Optional real-time information gathering

## 🔧 Environment Setup

Required environment variables:
```env
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## ✅ Testing

The course generation flow is now optimized for web API usage:
- Single database save per course
- Real-time progress via WebSocket
- Clean separation of concerns
- No duplicate functionality

The system is ready for production use with the SkillUp web application! 