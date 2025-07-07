# Course Agent Activation Guide

This guide explains the different ways to activate and use the SkillUp Course Builder Agent.

## 🚀 Quick Start

The course agent now supports three activation methods:

1. **Console Mode (Original)** - Interactive command-line interface
2. **JSON File Mode** - Automated activation via JSON configuration
3. **Frontend Streaming Mode** - Real-time web interface with live console output

---

## 📝 JSON File Activation

### Overview
Activate the course agent using a JSON configuration file instead of console interaction.

### JSON Structure
```json
{
  "course_topic": "Your Course Topic",
  "search_web": false,
  "user_id": "uuid-v4-string",
  "output_file": "./optional/output/path.json"
}
```

### Parameters
- **`course_topic`** (string, required): The topic for course generation
- **`search_web`** (boolean, default: false): Enable web search for current information  
- **`user_id`** (UUID string, required): User ID for course ownership
- **`output_file`** (string, optional): Path to save results JSON

### Usage

#### 1. Create Example Configuration
```bash
npm run course-agent:json create-example
```

This creates `course-activation-example.json`:
```json
{
  "course_topic": "Introduction to Machine Learning",
  "search_web": false,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "output_file": "./output/course_result.json"
}
```

#### 2. Run Course Generation
```bash
npm run course-agent:json run ./course-activation-example.json
```

#### 3. Custom Configuration
Create your own JSON file:
```json
{
  "course_topic": "Advanced React Patterns",
  "search_web": true,
  "user_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

Then run:
```bash
npm run course-agent:json run ./my-course-config.json
```

---

## 🌐 Frontend Streaming Mode

### Overview
Use the web interface to generate courses with real-time console output streaming.

### Features
- ✅ Real-time console output via WebSocket
- ✅ Progress tracking and status updates
- ✅ Start/stop course generation
- ✅ Live session monitoring
- ✅ Automatic course saving to database

### Setup

#### 1. Start Backend with WebSocket Support
```bash
cd backend
npm run dev
```
The backend now includes:
- WebSocket server on the same port as HTTP
- Course generation API endpoint
- Real-time streaming capabilities

#### 2. Start Frontend
```bash
cd skillup-front
npm run dev
```

#### 3. Access Course Generator
Navigate to: `http://localhost:3000/generate-course`

### API Endpoints

#### Start Course Generation
**POST** `/api/v1/course-generation/generate`

Request body:
```json
{
  "course_topic": "Introduction to Machine Learning",
  "search_web": false,
  "user_id": "uuid-string"
}
```

Response:
```json
{
  "success": true,
  "sessionId": "session_1234567890_abc123",
  "message": "Course generation started. Connect to WebSocket for real-time updates."
}
```

#### Session Status
**GET** `/api/v1/course-generation/session/{sessionId}/status`

#### WebSocket Events
- **Connect**: Join session room for real-time updates
- **`join_session`**: Join specific generation session
- **`course_generation_update`**: Real-time log messages
- **`course_generation_complete`**: Final completion status

---

## 📋 Environment Variables

### Backend (.env)
```env
# Required for course generation
OPENAI_API_KEY=your_openai_api_key

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Server configuration
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🎯 Usage Examples

### Example 1: Quick JSON Generation
```bash
# Create config
echo '{
  "course_topic": "Python for Beginners",
  "search_web": false,
  "user_id": "550e8400-e29b-41d4-a716-446655440000"
}' > python-course.json

# Generate course
npm run course-agent:json run python-course.json
```

### Example 2: Web Search Enabled
```json
{
  "course_topic": "Latest JavaScript ES2024 Features",
  "search_web": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "output_file": "./output/js-course.json"
}
```

### Example 3: Frontend Integration
1. Go to `/generate-course`
2. Enter topic: "Advanced React Hooks"
3. Check "Enable web search"
4. Click "Generate Course"
5. Watch real-time console output
6. Course automatically saved when complete

---

## 🔧 Development

### File Structure
```
backend/src/course_agent/
├── course-builder-agent.ts      # Original console mode
├── course-builder-json.ts       # JSON file activation
├── course-builder-stream.ts     # Streaming with WebSocket
├── json-runner.ts              # CLI for JSON mode
├── models.ts                   # Updated with CourseActivation schema
└── README-ACTIVATION.md        # This file

backend/src/route/
└── course-generation.route.ts  # API endpoints + WebSocket setup

skillup-front/src/components/course/
└── course-generator.tsx        # React component for real-time generation

skillup-front/src/app/generate-course/
└── page.tsx                   # Course generation page
```

### Adding New Features
1. **Extend CourseActivation schema** in `models.ts`
2. **Add API endpoints** in `course-generation.route.ts`
3. **Update streaming agent** in `course-builder-stream.ts`
4. **Enhance frontend UI** in `course-generator.tsx`

---

## 🚨 Troubleshooting

### Common Issues

#### 1. WebSocket Connection Failed
- Check backend is running on correct port
- Verify CORS configuration includes frontend URL
- Ensure firewall allows WebSocket connections

#### 2. JSON Validation Errors
- Verify `user_id` is valid UUID format
- Check all required fields are present
- Validate JSON syntax

#### 3. Course Generation Fails
- Verify OpenAI API key is set
- Check database connection
- Review console logs for specific errors

#### 4. Frontend Not Connecting
- Verify `NEXT_PUBLIC_BACKEND_URL` points to correct backend
- Check browser console for connection errors
- Ensure user is authenticated

### Debug Commands
```bash
# Check backend health
curl http://localhost:8000/health/db

# Test course generation API
curl -X POST http://localhost:8000/api/v1/course-generation/generate \
  -H "Content-Type: application/json" \
  -d '{"course_topic":"Test","search_web":false,"user_id":"550e8400-e29b-41d4-a716-446655440000"}'

# Check active sessions
curl http://localhost:8000/api/v1/course-generation/sessions
```

---

## 📈 Next Steps

1. **Try JSON activation** for automated course generation
2. **Explore frontend interface** for interactive experience  
3. **Monitor real-time logs** during generation
4. **Integrate with your applications** using the API

For more information, see the main [Course Agent README](./README.md). 