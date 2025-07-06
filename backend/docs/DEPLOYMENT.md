# 🚀 SkillUp Backend Deployment Guide

## Overview
Your SkillUp backend is deployed on **Railway** using **Docker** containerization.

**Live URL:** `https://skillup-production-18e3.up.railway.app`

## How It Works

### 1. Docker Container
- **Dockerfile** builds a production-ready Node.js container
- **Multi-stage build**: Compiles TypeScript → Creates optimized production image
- **docker-compose.yml**: Local development setup
- **docker-compose.prod.yml**: Production-ready configuration

### 2. Railway Deployment
- **Railway** automatically detects the `Dockerfile`
- **Builds** the Docker image in the cloud
- **Deploys** the container with auto-scaling
- **Provides** a production URL: `https://skillup-production-18e3.up.railway.app`

### 3. Docker + Railway Connection
```
Local Code → Docker Build → Railway Deploy → Live URL
     ↓              ↓              ↓            ↓
  Dockerfile → Container Image → Cloud Deploy → Production
```

## How to Activate/Use

### Local Development
```bash
# Development mode (hot reload)
docker-compose -f docker-compose.dev.yml up

# Production mode (local test)
docker-compose -f docker-compose.prod.yml up
```

### Production Deployment
```bash
# Deploy to Railway
railway up

# Check status
railway status

# Get URL
railway domain
```

## Environment Variables
Set these in Railway dashboard:
- `NODE_ENV=production`
- `FRONTEND_URL=https://skill-up-lake.vercel.app`
- `CORS_ORIGIN=https://skill-up-lake.vercel.app`
- `SUPABASE_URL=your_url`
- `SUPABASE_ANON_KEY=your_key`
- `OPENAI_API_KEY=your_key`

## API Endpoints
- `GET /` - Health check
- `GET /api/v1` - API info
- `GET /api/v1/users` - Get users
- `POST /api/v1/users` - Create user

## Key Benefits
- **Containerized**: Consistent environment across dev/prod
- **Auto-scaling**: Railway handles traffic spikes
- **Zero-downtime**: Automatic deployments
- **HTTPS**: Built-in SSL certificates
- **Monitoring**: Railway provides logs and metrics 