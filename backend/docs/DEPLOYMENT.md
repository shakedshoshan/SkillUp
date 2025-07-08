# 🚀 SkillUp Backend Deployment Guide

## Overview
Your SkillUp backend is deployed on **Railway** using **Docker** containerization with **Redis caching** and **WebSocket support**.

**Live URL:** `https://skillup-production-18e3.up.railway.app`

## Architecture
```
Frontend (Next.js) ↔ Backend (Node.js + Socket.IO) ↔ Redis Cache
                              ↓
                         Supabase Database
```

## How It Works

### 1. Docker Container Stack
- **Backend Service**: Node.js with Express + Socket.IO for real-time WebSockets
- **Redis Service**: In-memory caching for course data and session management
- **Multi-stage build**: Compiles TypeScript → Creates optimized production image
- **docker-compose.yml**: Complete stack with Redis
- **docker-compose.dev.yml**: Development environment
- **docker-compose.prod.yml**: Production-ready configuration

### 2. Railway Deployment
- **Railway** automatically detects the `Dockerfile`
- **Builds** the Docker image in the cloud
- **Deploys** the container with auto-scaling
- **Provides** a production URL: `https://skillup-production-18e3.up.railway.app`
- **Redis**: Either use Railway's Redis addon or external Redis service

### 3. Docker + Railway Connection
```
Local Code → Docker Build → Railway Deploy → Live URL
     ↓              ↓              ↓            ↓
  Dockerfile → Container Image → Cloud Deploy → Production
                      ↓
                 Redis Service
```

## How to Activate/Use

### Local Development
```bash
# Development mode (with Redis)
docker-compose -f docker/docker-compose.dev.yml up

# Production mode (local test with Redis)
docker-compose -f docker/docker-compose.prod.yml up

# Build and start fresh
docker-compose -f docker/docker-compose.dev.yml up --build

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker/docker-compose.dev.yml down

# Redis management scripts
npm run redis:keys        # View all Redis keys
npm run redis:clear       # Clear Redis cache
npm run redis:cli         # Connect to Redis CLI
```

### Production Deployment

#### Option 1: Railway with Redis Addon
```bash
# Add Redis to Railway project
railway add redis

# Deploy backend
railway up

# Check status
railway status

# Get URL
railway domain
```

#### Option 2: External Redis (Redis Cloud)
```bash
# Set REDIS_URL environment variable in Railway
# Deploy backend
railway up
```

#### Option 3: Docker Stack (Local/VPS)
```bash
# Use deployment script
./scripts/docker-deploy.sh -e prod --build

# Or manual deployment
docker-compose -f docker/docker-compose.prod.yml up -d --build

# Check services
docker-compose -f docker/docker-compose.prod.yml ps

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f
```

## Environment Variables
Set these in Railway dashboard or `.env` file:

### Core Application
- `NODE_ENV=production`
- `PORT=5000`
- `FRONTEND_URL=https://skill-up-lake.vercel.app`
- `CORS_ORIGIN=https://skill-up-lake.vercel.app`
- `TRUST_PROXY=true`

### Database & External Services
- `SUPABASE_URL=your_supabase_url`
- `SUPABASE_ANON_KEY=your_anon_key`
- `SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`
- `DATABASE_URL=your_database_url`
- `DATABASE_POOLED_URL=your_pooled_database_url` (optional)
- `OPENAI_API_KEY=your_openai_key`

### Redis Configuration
- `REDIS_URL=redis://localhost:6379` (or your Redis Cloud URL)
- `REDIS_KEY_PREFIX=skillup:` (optional)
- `REDIS_DEFAULT_TTL=3600` (optional, in seconds)
- `REDIS_COURSE_TTL=3600` (optional, in seconds)



## API Endpoints

### Health Checks
- `GET /` - Main health check
- `GET /health` - Combined health check (DB + Redis)
- `GET /health/db` - Database health check
- `GET /health/redis` - Redis health check

### Core API
- `GET /api/v1` - API info and available endpoints
- `GET /api/v1/users` - Get users
- `POST /api/v1/users` - Create user
- `GET /api/v1/courses` - Get courses
- `POST /api/v1/course-generation` - Generate course (with WebSocket streaming)

### WebSocket Endpoints
- **Socket.IO**: `/socket.io/` - Real-time course generation updates
- **Events**: `course:progress`, `course:complete`, `course:error`

## Key Benefits
- **Containerized**: Consistent environment across dev/prod
- **Auto-scaling**: Railway handles traffic spikes
- **Zero-downtime**: Automatic deployments
- **HTTPS**: Built-in SSL certificates
- **Monitoring**: Railway provides logs and metrics
- **Redis Caching**: Fast course data retrieval and session management
- **Real-time**: WebSocket support for live course generation updates
- **Fault Tolerant**: Redis reconnection and graceful error handling

## Troubleshooting

### Redis Connection Issues
```bash
# Check Redis connection
npm run redis:cli

# Clear Redis cache
npm run redis:clear

# View Redis keys
npm run redis:keys
```

### WebSocket Issues
- Ensure CORS is properly configured for your frontend domain
- Check that Socket.IO client version matches server version
- Verify no proxy/firewall is blocking WebSocket connections

### Docker Issues
```bash
# Rebuild containers
docker-compose -f docker/docker-compose.prod.yml up --build --force-recreate

# Check container logs
docker-compose -f docker/docker-compose.prod.yml logs backend
docker-compose -f docker/docker-compose.prod.yml logs redis

# Check container status
docker-compose -f docker/docker-compose.prod.yml ps
``` 