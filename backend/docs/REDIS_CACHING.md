# Redis Caching Implementation

This document describes the Redis caching implementation added to the SkillUp backend API to improve performance and reduce database load.

## Overview

The caching system uses Redis to store frequently accessed data with configurable Time-To-Live (TTL) values. The implementation follows best practices including:

- **Cache-aside pattern**: Application manages cache manually
- **Graceful degradation**: API continues to work even if Redis is unavailable
- **Automatic cache invalidation**: Cache is cleared when data changes
- **Configurable TTL**: Different cache durations for different data types
- **Error handling**: All cache operations fail gracefully without affecting core functionality

## Features Implemented

### Cached Endpoints

1. **`GET /api/v1/courses/:id`** - Full course data with nested parts, lessons, content, and quizzes
   - Cache key: `skillup:courses:course:{id}:full`
   - TTL: 1 hour (3600 seconds)
   - Cached on: First request after cache miss
   - Invalidated on: Course updates (future implementation)

2. **`GET /api/v1/courses`** - All courses list
   - Cache key: `skillup:courses:all`
   - TTL: 30 minutes (1800 seconds)
   - Cached on: First request after cache miss
   - Invalidated on: New course creation, course updates

### Cache Invalidation

The system automatically invalidates cache when data changes:

- **Course progress updates**: Clears user's enrolled courses cache
- **Course modifications**: Clears specific course cache and related patterns
- **Enrollment changes**: Clears user-specific caches

### Health Monitoring

Three health check endpoints are available:

- **`GET /health`** - Overall system health (database + Redis)
- **`GET /health/db`** - Database connection health
- **`GET /health/redis`** - Redis connection health with statistics

## Setup Instructions

### 1. Install Dependencies

The Redis client is already added to `package.json`:

```bash
npm install
```

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Redis Cloud Configuration (Required)
REDIS_URL=redis://default:your_password@redis-server.cloud.redislabs.com:port

# Redis Configuration (Optional)
REDIS_KEY_PREFIX=skillup:
REDIS_DEFAULT_TTL=3600
```

### 3. Redis Cloud Setup

#### Get Your Redis Cloud Connection URL

1. **Sign up for Redis Cloud** at [redis.com](https://redis.com/try-free/)
2. **Create a new database**
3. **Copy the connection URL** from your Redis Cloud dashboard
4. **Add to your environment variables**:

```env
REDIS_URL=redis://default:your_password@redis-server.cloud.redislabs.com:port
```

#### Redis Cloud Features Used
- **Automatic failover**: Built-in high availability
- **SSL/TLS encryption**: Secure connections by default  
- **Global replication**: Low latency worldwide
- **Monitoring**: Built-in performance metrics
- **Automatic scaling**: Handles traffic spikes

### 4. Verify Setup

Start your application and check the health endpoints:

```bash
npm run dev

# Check Redis Cloud connection
curl http://localhost:5000/health/redis

# Check overall health  
curl http://localhost:5000/health
```

You should see output like:
```json
{
  "status": "healthy",
  "redis": "connected", 
  "stats": {
    "connected": true,
    "provider": "Redis Cloud",
    "dbSize": 0,
    "keyPrefix": "skillup:",
    "defaultTTL": 3600
  }
}
```

## Usage Examples

### Basic Cache Operations

```typescript
import { cacheService } from '../services/cache.service';

// Get from cache
const data = await cacheService.get('my-key');

// Set to cache with TTL
await cacheService.set('my-key', data, { ttl: 3600 });

// Delete from cache
await cacheService.del('my-key');

// Cache-aside pattern
const result = await cacheService.getOrSet(
  'expensive-operation',
  async () => {
    // Expensive database operation
    return await database.complexQuery();
  },
  { ttl: 1800 }
);
```

### Custom Cache Options

```typescript
// Custom key prefix
await cacheService.set('user-data', userData, {
  keyPrefix: 'users:',
  ttl: 7200
});

// Clear pattern
await cacheService.clearByPattern('user:123:*');
```

## Cache Strategy Details

### Cache Keys Structure

All cache keys follow a consistent naming pattern:

```
{prefix}{category}:{entity}:{id}:{type}
```

Examples:
- `skillup:courses:course:123:full` - Full course data
- `skillup:courses:all` - All courses list
- `skillup:user:456:enrolled-courses` - User's enrolled courses

### TTL Strategy

Different data types have different cache durations:

- **Full course data**: 1 hour (relatively stable, expensive to compute)
- **Course lists**: 30 minutes (changes more frequently)
- **User progress**: 15 minutes (changes often)
- **Static content**: 24 hours (rarely changes)

### Cache Invalidation Patterns

1. **Write-through**: Update database first, then invalidate cache
2. **Time-based**: Let cache expire naturally for less critical data
3. **Event-based**: Invalidate immediately when specific actions occur

## Monitoring and Debugging

### Logs

The application logs cache operations:

```
Cache hit for course 123
Cache miss for course 456, fetching from database
Course 789 cached successfully
Cache invalidated for course 123
```

### Redis Cloud CLI Commands

Connect to your Redis Cloud instance:

```bash
# Connect to Redis Cloud (replace with your connection details)
redis-cli -h your-redis-server.cloud.redislabs.com -p your-port -a your-password

# List all keys with pattern
KEYS skillup:*

# Get specific key
GET skillup:courses:course:123:full

# Check TTL
TTL skillup:courses:course:123:full

# Delete specific key  
DEL skillup:courses:course:123:full

# Flush all cache (development only)
FLUSHDB
```

**Pro Tip**: Use the Redis Cloud web console for easier data browsing and monitoring.

### Performance Monitoring

Monitor cache performance using:

```bash
# Redis Cloud stats
curl http://localhost:5000/health/redis

# Check response times with/without cache
curl -w "%{time_total}\n" -o /dev/null -s http://localhost:5000/api/v1/courses/123
```

**Redis Cloud Dashboard**: Monitor performance metrics directly in your Redis Cloud console including:
- Memory usage
- Operations per second
- Network I/O
- Connection count

## Troubleshooting

### Common Issues

1. **Redis Cloud connection failed**
   - Verify `REDIS_URL` environment variable is correct
   - Check Redis Cloud dashboard for database status
   - Ensure your IP is allowlisted in Redis Cloud (if applicable)

2. **Cache not working**
   - Verify Redis health endpoint returns `"provider": "Redis Cloud"`
   - Check application logs for cache errors
   - Ensure TTL values are positive numbers

3. **Stale cache data**
   - Check if cache invalidation is working
   - Use Redis Cloud console to manually clear cache
   - Verify TTL settings are appropriate

### Error Handling

The cache service fails gracefully:

- If Redis is unavailable, API continues without caching
- Cache errors are logged but don't break the application
- Database is always the source of truth

## Performance Benefits

Expected performance improvements:

- **Course detail page**: 80-90% faster response time
- **Course list page**: 70-80% faster response time
- **Database load**: 60-70% reduction in complex queries
- **User experience**: Significantly faster page loads

## Security Considerations

**Redis Cloud handles security automatically:**
- **TLS encryption**: All connections encrypted by default
- **Authentication**: Strong password authentication required
- **Network isolation**: Private networks and VPC peering available
- **Compliance**: SOC 2, GDPR, HIPAA compliant
- **Regular updates**: Automatic security patches and updates

**Additional recommendations:**
- Use strong passwords for Redis Cloud
- Rotate credentials regularly
- Enable IP allowlisting if needed
- Monitor access logs in Redis Cloud dashboard

## Future Enhancements

Planned improvements:

1. **Cache warming**: Pre-populate cache for popular courses
2. **Advanced invalidation**: More granular cache invalidation
3. **Cache analytics**: Detailed hit/miss ratio tracking
4. **Distributed caching**: Redis Cluster for high availability
5. **Cache compression**: Reduce memory usage for large objects

## Configuration Reference

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | **Required** | Redis Cloud connection URL with authentication |
| `REDIS_KEY_PREFIX` | `skillup:` | Prefix for all cache keys |
| `REDIS_DEFAULT_TTL` | `3600` | Default cache TTL in seconds |

### Cache Service API

```typescript
interface CacheOptions {
  ttl?: number;        // Time to live in seconds
  keyPrefix?: string;  // Custom key prefix
}

class CacheService {
  get<T>(key: string, options?: CacheOptions): Promise<T | null>
  set(key: string, value: any, options?: CacheOptions): Promise<boolean>
  del(key: string, options?: CacheOptions): Promise<boolean>
  exists(key: string, options?: CacheOptions): Promise<boolean>
  expire(key: string, ttl: number, options?: CacheOptions): Promise<boolean>
  clearByPattern(pattern: string, options?: CacheOptions): Promise<number>
  getOrSet<T>(key: string, fetchFunction: () => Promise<T>, options?: CacheOptions): Promise<T>
  getStats(): Promise<any>
}
``` 