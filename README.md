# SkillUp - AI-Powered Learning Platform

<div align="center">

![SkillUp Logo](https://img.shields.io/badge/SkillUp-AI%20Learning%20Platform-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)

**An intelligent learning platform that generates personalized courses using AI, tracks progress, and connects learners with mentors.**


</div>

## 🚀 Overview

SkillUp is a comprehensive AI-powered learning platform that revolutionizes online education by automatically generating personalized courses on any topic. The platform combines cutting-edge AI technology with modern web development practices to create an engaging, scalable learning experience.

### Key Features

- 🤖 **AI Course Generation**: Automatically create comprehensive courses using OpenAI's GPT and LangChain for AI workflows, models with optional web search for current information
- 🎯 **Personalized Learning**: AI-powered course recommendations and adaptive learning paths
- 💬 **Intelligent Chatbot**: CourseBot powered by Ollama/Gemma for course idea brainstorming
- 📊 **Progress Tracking**: Detailed analytics and progress monitoring for learners
- 🔄 **Real-time Updates**: WebSocket-based real-time course generation progress
- 🗄️ **Robust Caching**: Redis-powered caching for optimal performance
- 🔐 **Secure Authentication**: Supabase Auth integration with role-based access
- 📱 **Responsive Design**: Modern, mobile-first UI built with Next.js and Tailwind CSS

## 🏗️ Architecture

SkillUp follows a modern microservices-inspired architecture with the following components:

```
SkillUp/
├── skillup-front/          # Next.js Frontend Application
├── backend/               # Express.js Backend API
│   ├── src/
│   │   ├── course_agent/  # AI Course Generation Engine
│   │   ├── llm/          # Chatbot & LLM Services
│   │   ├── controller/   # API Controllers
│   │   ├── route/        # API Routes
│   │   └── services/     # Business Logic Services
│   └── docker/           # Docker Configuration
└── docs/                 # Documentation
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Real-time**: Socket.io Client
- **Testing**: Jest with React Testing Library

#### Backend
- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Caching**: Redis Cloud
- **AI/ML**: 
  - OpenAI GPT-4 for course generation
  - Ollama with Gemma 3n for CourseBot
  - LangChain for AI workflows
- **Real-time**: Socket.io
- **Authentication**: Supabase Auth
- **Validation**: Zod schemas

#### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Railway/Railway
  - Database: Supabase Cloud
- **Monitoring**: Built-in health checks and logging

## 🎯 Core Features

### 1. AI Course Generation Engine

The platform's flagship feature uses advanced AI to automatically generate comprehensive courses:

- **Intelligent Structure**: AI analyzes topics and creates logical course outlines
- **Web Search Integration**: Optional real-time web search for current information
- **Multi-step Workflow**: 
  1. Extract course structure
  2. Build detailed lessons
  3. Generate comprehensive content
- **Real-time Progress**: WebSocket-based progress updates during generation
- **Automatic Saving**: Courses are automatically saved to the database

### 2. CourseBot - AI Learning Assistant

An intelligent chatbot powered by Ollama and Gemma 3n:

- **Course Brainstorming**: Helps users identify and develop course ideas
- **Context-Aware Conversations**: Maintains conversation history for natural dialogue
- **Structured Suggestions**: Provides actionable course recommendations
- **Health Monitoring**: Built-in service health checks

### 3. Learning Management System

Comprehensive course management and learning features:

- **Course Enrollment**: Easy enrollment and progress tracking
- **Lesson Completion**: Mark lessons as complete with progress tracking
- **Interactive Quizzes**: Built-in quiz system for knowledge assessment
- **Progress Analytics**: Detailed progress reports and analytics
- **User Dashboards**: Personalized learning dashboards

### 4. Real-time Features

Modern real-time capabilities for enhanced user experience:

- **Live Course Generation**: Real-time progress updates during AI course creation
- **WebSocket Integration**: Socket.io for real-time communication
- **Instant Notifications**: Real-time updates for course completion and progress

## 🌐 API Endpoints

### Core Endpoints

#### Course Management
- `GET /api/v1/courses` - List all courses
- `GET /api/v1/courses/:id` - Get course details
- `POST /api/v1/courses/:courseId/enroll` - Enroll in course
- `PUT /api/v1/courses/:courseId/progress` - Update progress

#### Course Generation
- `POST /api/v1/course-generation/generate` - Generate new course
- `GET /api/v1/course-generation/status/:sessionId` - Check generation status
- `GET /api/v1/course-generation/logs/:sessionId` - Get generation logs

#### Chat & AI
- `POST /api/v1/chat` - Chat with CourseBot
- `GET /api/v1/chat/health` - Check CourseBot health
- `POST /api/v1/chat/enhanced` - Enhanced AI chat

#### User Management
- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `GET /api/v1/users/:userId/enrolled-courses` - Get enrolled courses

### Health Checks
- `GET /health` - Overall system health
- `GET /health/db` - Database health
- `GET /health/redis` - Redis health


## 📊 Monitoring & Health Checks

The platform includes comprehensive monitoring:

### Health Endpoints
- **Overall Health**: `/health`
- **Database Health**: `/health/db`
- **Redis Health**: `/health/redis`

### Logging
- **Request Logging**: All API requests are logged
- **Performance Monitoring**: Response time tracking
- **Error Tracking**: Comprehensive error logging

### Metrics
- **Cache Performance**: Redis hit/miss ratios
- **API Performance**: Response times and throughput
- **AI Service Health**: OpenAI and Ollama service status

## 🔒 Security

### Authentication & Authorization
- **Supabase Auth**: Secure user authentication
- **JWT Tokens**: Stateless authentication
- **Role-based Access**: User role management

### Data Protection
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy
- **CORS Configuration**: Strict CORS policies

### API Security
- **Rate Limiting**: Request throttling
- **Request Validation**: Comprehensive input validation
- **Error Handling**: Secure error responses

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Build**: Set build command to `npm run build`
3. **Environment Variables**: Add required environment variables
4. **Deploy**: Automatic deployment on push to main branch

### Backend Deployment (Railway)

1. **Connect Repository**: Link your GitHub repository to Railway
2. **Environment Variables**: Configure all required environment variables
3. **Build Command**: Set to `npm run build`
4. **Start Command**: Set to `npm start`

### Database Setup (Supabase)

1. **Create Project**: Create a new Supabase project
2. **Run Migrations**: Execute the migration scripts
3. **Configure Auth**: Set up authentication providers
4. **API Keys**: Copy API keys to environment variables

### Redis Setup (Redis Cloud)

1. **Create Database**: Create a new Redis Cloud database
2. **Connection String**: Copy the connection URL
3. **Environment Variable**: Add to backend environment variables

### Development Guidelines

- **TypeScript**: Use TypeScript for all new code
- **Testing**: Maintain test coverage above 80%
- **Documentation**: Update documentation for new features
- **Code Style**: Follow ESLint and Prettier configurations

## 📚 Documentation

### Additional Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./skillup-front/README.md)
- [Course Agent Documentation](./backend/src/course_agent/README.md)
- [LLM Services Documentation](./backend/src/llm/README.md)
- [Docker Quickstart](./backend/docs/DOCKER_QUICKSTART.md)
- [Deployment Guide](./backend/docs/DEPLOYMENT.md)
- [Redis Caching Guide](./backend/docs/REDIS_CACHING.md)


## 🙏 Acknowledgments

- **OpenAI**: For providing the GPT models that power course generation
- **Supabase**: For the excellent database and authentication platform
- **Vercel**: For the amazing hosting platform
- **Next.js Team**: For the incredible React framework
- **Tailwind CSS**: For the utility-first CSS framework

---

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/your-username/skillup?style=social)](https://github.com/your-username/skillup)
[![GitHub forks](https://img.shields.io/github/forks/your-username/skillup?style=social)](https://github.com/your-username/skillup)
[![GitHub issues](https://img.shields.io/github/issues/your-username/skillup)](https://github.com/your-username/skillup/issues)

</div> 
