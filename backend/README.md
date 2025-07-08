# SkillUp Backend

AI-powered course generation platform backend with Redis Cloud caching.

## Features

- 🤖 AI-powered course generation using LangGraph
- 🚀 High-performance API with Redis Cloud caching
- 📊 Real-time WebSocket support
- 🗄️ Supabase database integration
- 🔒 Type-safe with TypeScript
- 📈 Built-in health monitoring

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required environment variables:**
- `REDIS_URL` - Your Redis Cloud connection URL
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - Your OpenAI API key

### 3. Redis Cloud Setup

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database
3. Copy the connection URL to your `.env` file:
   ```env
   REDIS_URL=redis://default:password@your-server.cloud.redislabs.com:port
   ```

### 4. Database Setup

Run migrations:
```bash
npm run migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Health Checks

- **Overall Health**: `GET /health`
- **Database Health**: `GET /health/db` 
- **Redis Cloud Health**: `GET /health/redis`

## API Endpoints

### Courses
- `GET /api/v1/courses` - List all courses (cached)
- `GET /api/v1/courses/:id` - Get course details (cached)
- `GET /api/v1/courses/published` - List published courses
- `POST /api/v1/courses/:courseId/enroll` - Enroll in course

### Course Generation
- `POST /api/v1/course-generation/generate` - Generate new course
- `GET /api/v1/course-generation/status/:sessionId` - Check generation status

### Users
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/:id` - Get user details

## Caching

The API uses Redis Cloud for high-performance caching:

- **Course Details**: 1 hour cache
- **Course Lists**: 30 minute cache  
- **Automatic Invalidation**: Cache clears when data changes

See `docs/REDIS_CACHING.md` for detailed caching documentation.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

## Architecture

```
src/
├── config/          # Configuration files
│   ├── db.config.ts    # Supabase configuration
│   ├── env.config.ts   # Environment variables
│   └── redis.config.ts # Redis Cloud configuration
├── controller/      # API controllers
├── course_agent/    # AI course generation
├── route/          # API routes
├── services/       # Business logic services
│   └── cache.service.ts # Redis Cloud caching
└── migrations/     # Database migrations
```

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
NODE_ENV=production
TRUST_PROXY=true
REDIS_URL=redis://default:password@prod-server.cloud.redislabs.com:port
# ... other production values
```

### Docker Support

```bash
# Build image
docker build -t skillup-backend .

# Run container
docker run -p 5000:5000 --env-file .env skillup-backend
```

## Monitoring

### Redis Cloud Dashboard
- Monitor cache performance
- View memory usage and operations/sec
- Set up alerts for connection issues

### Application Logs
- Cache hit/miss ratios
- Performance metrics
- Error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details 