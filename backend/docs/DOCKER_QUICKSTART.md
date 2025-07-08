# 🐳 Docker Quick Start Guide

## SkillUp Backend with Redis & WebSockets

This guide will get your SkillUp backend running with Docker, including Redis caching and WebSocket support.

## Prerequisites

- **Docker Desktop** installed and running
- **Node.js 18+** (for npm scripts)
- **Git** for cloning the repository

## Quick Start

### 1. Environment Setup

Create your `.env` file in the backend directory:

```bash
# Copy example environment file
cp .env.example .env

# Edit with your configuration
nano .env
```

Required environment variables:
```env
# Core Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# OpenAI
OPENAI_API_KEY=your_openai_key

# Redis (optional - Docker will provide local Redis)
REDIS_URL=redis://redis-dev:6379
REDIS_KEY_PREFIX=skillup:dev:
```

### 2. Development Mode

Start the complete stack with one command:

```bash
# Start backend + Redis for development
docker-compose -f docker/docker-compose.dev.yml up

# Or run in background
docker-compose -f docker/docker-compose.dev.yml up -d

# Force rebuild if needed
docker-compose -f docker/docker-compose.dev.yml up --build
```

Your services will be available at:
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/socket.io/
- **Redis**: localhost:6379

### 3. Production Mode (Local Testing)

```bash
# Start production-like environment
docker-compose -f docker/docker-compose.prod.yml up

# With rebuild
docker-compose -f docker/docker-compose.prod.yml up --build
```

### 4. Using the Deployment Script

The deployment script provides advanced options:

```bash
# Development with logs
./scripts/docker-deploy.sh -e dev --logs

# Production with rebuild
./scripts/docker-deploy.sh -e prod --build

# Stop all services
./scripts/docker-deploy.sh --stop

# Restart services
./scripts/docker-deploy.sh --restart
```

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │     Redis       │
│   (Next.js)     │◄──►│  (Node.js +     │◄──►│   (Cache +      │
│   localhost:3000│    │   Socket.IO)    │    │   Sessions)     │
│                 │    │   localhost:5000│    │   localhost:6379│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Supabase      │
                       │   (Database)    │
                       │   Remote        │
                       └─────────────────┘
```

## Essential Commands

### Docker Operations

```bash
# View running services
docker-compose -f docker/docker-compose.dev.yml ps

# View logs (all services)
docker-compose -f docker/docker-compose.dev.yml logs -f

# View backend logs only
docker-compose -f docker/docker-compose.dev.yml logs -f skillup-backend-dev

# View Redis logs only
docker-compose -f docker/docker-compose.dev.yml logs -f redis-dev

# Stop services
docker-compose -f docker/docker-compose.dev.yml down

# Remove volumes (clean slate)
docker-compose -f docker/docker-compose.dev.yml down -v

# Rebuild and start
docker-compose -f docker/docker-compose.dev.yml up --build --force-recreate
```

### Redis Management

```bash
# Connect to Redis CLI
npm run redis:cli

# View all cache keys
npm run redis:keys

# Clear all cache
npm run redis:clear

# Direct Redis access (in container)
docker-compose -f docker/docker-compose.dev.yml exec redis-dev redis-cli
```

## Health Checks

Verify your services are running correctly:

```bash
# Check overall health
curl http://localhost:5000/health

# Check database connection
curl http://localhost:5000/health/db

# Check Redis connection
curl http://localhost:5000/health/redis

# Check WebSocket endpoint
curl http://localhost:5000/socket.io/

# Pretty formatted output
curl http://localhost:5000/health | jq
```

Expected healthy response:
```json
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  },
  "redis": {
    "connected": true,
    "dbSize": 0,
    "memoryUsage": "1.2MB"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing WebSockets

Test real-time functionality:

```bash
# Test course generation endpoint
curl -X POST http://localhost:5000/api/v1/course-generation \
  -H "Content-Type: application/json" \
  -d '{"topic": "Docker Basics", "difficulty": "beginner"}'
```

## Troubleshooting

### Common Issues

#### 1. Services Won't Start
```bash
# Check if ports are in use
netstat -an | findstr :5000
netstat -an | findstr :6379

# Kill processes using ports
taskkill /F /PID <process_id>

# Or use different ports
PORT=5001 docker-compose -f docker/docker-compose.dev.yml up
```

#### 2. Redis Connection Issues
```bash
# Check Redis container
docker-compose -f docker/docker-compose.dev.yml ps redis-dev

# Restart Redis only
docker-compose -f docker/docker-compose.dev.yml restart redis-dev

# Check Redis logs
docker-compose -f docker/docker-compose.dev.yml logs redis-dev
```

#### 3. Backend Build Errors
```bash
# Clean rebuild
docker-compose -f docker/docker-compose.dev.yml down
docker-compose -f docker/docker-compose.dev.yml build --no-cache
docker-compose -f docker/docker-compose.dev.yml up

# Check build logs
docker-compose -f docker/docker-compose.dev.yml build skillup-backend-dev
```

#### 4. Environment Variable Issues
```bash
# Check environment variables are loaded
docker-compose -f docker/docker-compose.dev.yml exec skillup-backend-dev env | grep REDIS

# Restart with fresh environment
docker-compose -f docker/docker-compose.dev.yml down
docker-compose -f docker/docker-compose.dev.yml up
```

### Debug Mode

Run with detailed logging:

```bash
# Set debug environment
DEBUG=* docker-compose -f docker/docker-compose.dev.yml up

# Or debug specific modules
DEBUG=redis:*,socket.io:* docker-compose -f docker/docker-compose.dev.yml up
```

## Development Workflow

### 1. Code Changes
The development setup rebuilds on changes:

```bash
# Start development with file watching
docker-compose -f docker/docker-compose.dev.yml up

# Your code changes will trigger rebuilds automatically
```

### 2. Database Changes
For database migrations:

```bash
# Run migrations
docker-compose -f docker/docker-compose.dev.yml exec skillup-backend-dev npm run migrate

# Check migration status
docker-compose -f docker/docker-compose.dev.yml exec skillup-backend-dev npm run migrate:status
```

### 3. Cache Management
During development:

```bash
# Clear cache when testing
npm run redis:clear

# Monitor cache keys
npm run redis:keys

# Test cache performance
curl -w "Time: %{time_total}s\n" http://localhost:5000/api/v1/courses
```

## Production Deployment

### Local Production Test
```bash
# Test production build locally
docker-compose -f docker/docker-compose.prod.yml up --build

# Check production health
curl http://localhost:5000/health
```

### Railway Deployment
```bash
# Deploy to Railway (requires railway CLI)
railway up

# Or use GitHub integration with proper environment variables
```

### VPS Deployment
```bash
# Copy files to server
scp -r docker/ user@server:/path/to/skillup/

# On server
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

## Monitoring

### Resource Usage
```bash
# Check container resource usage
docker stats

# Detailed container info
docker-compose -f docker/docker-compose.dev.yml ps
docker-compose -f docker/docker-compose.dev.yml top
```

### Logs
```bash
# Follow all logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Filter logs by service
docker-compose -f docker/docker-compose.dev.yml logs -f redis-dev | grep ERROR

# Save logs to file
docker-compose -f docker/docker-compose.dev.yml logs > debug.log
```

## Performance Tips

1. **Use SSD storage** for Docker volumes
2. **Allocate sufficient memory** to Docker Desktop (4GB+ recommended)
3. **Enable BuildKit** for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   ```
4. **Use Docker layer caching** in CI/CD
5. **Monitor Redis memory** usage and set appropriate limits

## Next Steps

1. **Frontend Integration**: Connect your Next.js frontend to `http://localhost:5000`
2. **WebSocket Testing**: Implement real-time features using Socket.IO
3. **Production Setup**: Configure external Redis for production deployment
4. **Monitoring**: Set up logging and monitoring for production
5. **Scaling**: Consider Redis Cluster for high availability

## Support

- **Documentation**: Check `/docs` directory for detailed guides
- **Health Checks**: Use `/health` endpoints for status monitoring
- **Redis Tools**: Use npm scripts for Redis management
- **Docker Logs**: Check container logs for debugging

Happy coding! 🚀 